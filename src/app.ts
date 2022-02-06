// eslint-disable-next-line import/no-extraneous-dependencies
import { ScheduledHandler } from 'aws-lambda';
import { DateTime } from 'luxon';
import MessageInfo from './message_info';
import UsedMessageIds from './used_messageids';
import Queue from './queue';
import Webhook from './webhook';
import logger from './logger';

const stage = process.env.STAGE ?? '';
const messageIdTableName = process.env.MESSAGEID_TABLE_NAME ?? '';
const queueUrl = process.env.QUEUE_URL ?? '';

// eslint-disable-next-line import/prefer-default-export
export const handler: ScheduledHandler = async (_event) => {
  const usedMessageIds = new UsedMessageIds(messageIdTableName);
  const now = DateTime.local();
  const queue = new Queue(queueUrl);
  const queueMessages = await queue.receiveMessages();

  const handles: (string | null)[] = await Promise.all(
    queueMessages.map(async (v) => {
      if (await usedMessageIds.contains(v.messageId)) {
        logger.info(`Already used messageId: ${v.messageId}`);
        return v.handle;
      }

      const messageInfo: MessageInfo = new MessageInfo(v.body);
      const webhookname = messageInfo.getWebhookName();

      if (webhookname === '') {
        return v.handle;
      }

      const webhook = await Webhook.create(stage, webhookname);
      const message = messageInfo.getMessage();
      const resultType = await webhook.sendMessage(message);

      if (resultType === 'NeedRetry') {
        return null;
      }

      await usedMessageIds.add(v.messageId, now);
      return v.handle;
    }),
  );

  const deleteTargets: string[] = [];

  handles.forEach((handle) => {
    if (handle != null) {
      deleteTargets.push(handle);
    }
  });

  if (deleteTargets.length > 0) {
    await queue.deleteMessages(deleteTargets);
  }
};
