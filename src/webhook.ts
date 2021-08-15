import AWS from 'aws-sdk';
import axios from 'axios';
import logger from './logger';
import { MessagePayload } from './message_info';

export const ResultType = {
  Success: 0,
  NotSuccess: 1,
  NeedRetry: 2
} as const;

type ResultType = typeof ResultType[keyof typeof ResultType];

export default class Webhook {
  private url: string;

  private constructor(url: string) {
    this.url = url;
  }

  public static async create(
    stage: string,
    webhookName: string
  ): Promise<Webhook> {
    const url = await Webhook.getSlackUrl(stage, webhookName);
    return new Webhook(url);
  }

  public async sendMessage(message: MessagePayload): Promise<ResultType> {
    const response = await axios.post(this.url, message, {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      validateStatus(_status) {
        // ステータスコードに関しての例外は発生させない
        return true;
      }
    });

    const logMessage = `Posted: url=${this.url}, message=${JSON.stringify(
      message
    )}, httpstatus=${response.status}`;
    const resultType = Webhook.getResultType(response.status);

    if (resultType === ResultType.Success) {
      logger.info(logMessage);
    } else {
      logger.error(logMessage);
    }

    return resultType;
  }

  private static async getSlackUrl(
    stage: string,
    webhookName: string
  ): Promise<string> {
    const parameterName = `/${stage}/SlackIncomingWebhook/${webhookName}/WebHookUrl`;
    try {
      const ssm = new AWS.SSM();
      const response = await ssm
        .getParameter({ Name: parameterName })
        .promise();
      const url = response.Parameter?.Value;
      return url ?? '';
    } catch (e) {
      logger.error(`Error: ${e}`);
      return '';
    }
  }

  private static getResultType(statusCode: number): ResultType {
    if (statusCode === 200) {
      return ResultType.Success;
    }

    if (statusCode < 500) {
      return ResultType.NotSuccess;
    }

    return ResultType.NeedRetry;
  }
}
