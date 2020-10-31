import { SQSHandler } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import AWS from 'aws-sdk';
import axios from 'axios';
import bunyan from 'bunyan';
import { DateTime } from 'luxon';

const stage = process.env.STAGE ?? '';
const messageIdTableName = process.env.MESSAGEID_TABLE_NAME ?? '';

const logger = bunyan.createLogger({ name: 'SlackIncomingWebHook' });
logger.level(bunyan.DEBUG);

const ssm = new AWS.SSM();
const docClient = new AWS.DynamoDB.DocumentClient();

const getSlackUrl = async (appname: string): Promise<string> => {
  const parameterName = `/${stage}/SlackIncomingWebhook/${appname}/WebHookUrl`;
  try {
    const response = await ssm.getParameter({ Name: parameterName }).promise();
    const url = response.Parameter?.Value;
    return url ?? '';
  } catch (e) {
    logger.error(`Error: ${e}`);
    return '';
  }
};

const isUsedMessageId = async (messageId: string): Promise<boolean> => {
  const data = await docClient
    .get({ TableName: messageIdTableName, Key: { MessageId: messageId } })
    .promise();

  return data.Item !== undefined;
};

const setUsedMessageId = async (messageId: string): Promise<void> => {
  const tomorrow = DateTime.local().plus({ days: 1 });
  await docClient
    .put({
      TableName: messageIdTableName,
      Item: {
        MessageId: messageId,
        TTL: Math.floor(tomorrow.toMillis() / 1000)
      }
    })
    .promise();
};

enum ResultType {
  Success,
  NotSuccess,
  NeedRetry
}

const getResultType = (statusCode: number): ResultType => {
  if (statusCode === 200) {
    return ResultType.Success;
  }

  if (statusCode < 500) {
    return ResultType.NotSuccess;
  }

  return ResultType.NeedRetry;
};

interface MessageInfo {
  webhookname: string;
  message: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const implementsMessageInfo = (arg: any): arg is MessageInfo => {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    typeof arg.webhookname === 'string' &&
    typeof arg.message === 'string'
  );
};

const getMessageInfo = (messageBody: string): MessageInfo => {
  const errorMessageInfo = { webhookname: '', message: '' };
  try {
    const messageInfo = JSON.parse(messageBody);
    if (implementsMessageInfo(messageInfo)) {
      return messageInfo;
    }

    logger.error(`Bad format: ${messageBody}`);
  } catch (e) {
    logger.error(`JSON.parse error: ${e}`);
  }

  return errorMessageInfo;
};

// eslint-disable-next-line import/prefer-default-export
export const handler: SQSHandler = async event => {
  const needRetries = await Promise.all(
    event.Records.map(async v => {
      if (await isUsedMessageId(v.messageId)) {
        logger.info(`Already used messageId: ${v.messageId}`);
        return false;
      }

      const { webhookname, message } = getMessageInfo(v.body);
      if (webhookname === '') {
        return false;
      }
      const url = await getSlackUrl(webhookname);
      if (url === '') {
        return false;
      }

      const response = await axios.post(
        url,
        { text: message },
        {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          validateStatus(_status) {
            // ステータスコードに関しての例外は発生させない
            return true;
          }
        }
      );

      const logMessage = `Posted: url=${url}, message=${message}, httpstatus=${response.status}`;
      const resultType = getResultType(response.status);
      if (resultType === ResultType.Success) {
        logger.info(logMessage);
      } else {
        logger.error(logMessage);
      }

      if (resultType === ResultType.NeedRetry) {
        return true;
      }

      await setUsedMessageId(v.messageId);
      return false;
    })
  );

  if (needRetries.some(v => v)) {
    throw new Error('need to retry');
  }
};
