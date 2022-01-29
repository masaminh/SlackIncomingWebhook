import { SQSHandler } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import { DateTime } from 'luxon';
import MessageInfo from './message_info';
import UsedMessageIds from './used_messageids';
import Webhook from './webhook';
import logger from './logger';

const stage = process.env.STAGE ?? '';
const messageIdTableName = process.env.MESSAGEID_TABLE_NAME ?? '';

// eslint-disable-next-line import/prefer-default-export
export const handler: SQSHandler = async event => {
  const usedMessageIds = new UsedMessageIds(messageIdTableName);
  const now = DateTime.local();

  const needRetries = await Promise.all(
    event.Records.map(async v => {
      if (await usedMessageIds.contains(v.messageId)) {
        logger.info(`Already used messageId: ${v.messageId}`);
        return false;
      }

      const messageInfo: MessageInfo = new MessageInfo(v.body);
      const webhookname = messageInfo.getWebhookName();

      if (webhookname === '') {
        return false;
      }

      const webhook = await Webhook.create(stage, webhookname);
      const message = messageInfo.getMessage();
      const resultType = await webhook.sendMessage(message);

      if (resultType === 'NeedRetry') {
        return true;
      }

      await usedMessageIds.add(v.messageId, now);
      return false;
    })
  );

  if (needRetries.some(v => v)) {
    throw new Error('need to retry');
  }
};
