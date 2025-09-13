import type { SQSHandler } from 'aws-lambda';
import { DateTime } from 'luxon';
import MessageInfo from './message_info';
import UsedMessageIds from './used_messageids';
import Webhook from './webhook';
import logger from './logger';

const stage = process.env.STAGE ?? '';
const messageIdTableName = process.env.MESSAGEID_TABLE_NAME ?? '';

// eslint-disable-next-line import/prefer-default-export
export const handler: SQSHandler = async (event) => {
  const usedMessageIds = new UsedMessageIds(messageIdTableName);
  const now = DateTime.local();
  const queueMessages = event.Records.map((record) => ({
    messageId: record.messageId,
    body: record.body,
  }));

  const failedMessageId: (string | undefined)[] = await Promise.all(
    queueMessages.map(async (v) => {
      try {
        if (await usedMessageIds.contains(v.messageId)) {
          logger.info(`Already used messageId: ${v.messageId}`);
          return undefined;
        }

        const messageInfo: MessageInfo = new MessageInfo(v.body);
        const webhookname = messageInfo.getWebhookName();

        if (webhookname === '') {
          return undefined;
        }

        const webhook = await Webhook.create(stage, webhookname);
        const message = messageInfo.getMessage();
        const resultType = await webhook.sendMessage(message);

        if (resultType === 'NeedRetry') {
          return v.messageId;
        }

        await usedMessageIds.add(v.messageId, now);
        return undefined;
      } catch (e: unknown) {
        if (e instanceof Error) {
          logger.warn(e.message);
        }
        return v.messageId;
      }
    }),
  );

  const batchItemFailures = failedMessageId.flatMap((messageId) => {
    if (messageId == null) {
      return [];
    }

    return [{ itemIdentifier: messageId }];
  });

  return { batchItemFailures };
};
