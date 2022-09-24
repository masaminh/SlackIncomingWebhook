import AWS from 'aws-sdk';
import logger from './logger';

export type QueueMessage = {
  messageId: string;
  body: string;
  handle: string;
}

export default class Queue {
  constructor(url: string) {
    this.sqs = new AWS.SQS();
    this.url = url;
  }

  public async receiveMessages(): Promise<QueueMessage[]> {
    const result = await this.sqs.receiveMessage({
      QueueUrl: this.url,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1,
    }).promise();

    const queueMessages: QueueMessage[] = [];

    result.Messages?.forEach((message) => {
      if (message.MessageId == null || message.Body == null || message.ReceiptHandle == null) {
        return;
      }

      queueMessages.push({
        messageId: message.MessageId,
        body: message.Body,
        handle: message.ReceiptHandle,
      });
    });

    return queueMessages;
  }

  public async deleteMessages(handles: string[]): Promise<void> {
    const entries = handles.map((handle, index) => ({ Id: `${index}`, ReceiptHandle: handle }));
    logger.info(`delete messages: entries=${JSON.stringify(entries)}`);
    await this.sqs.deleteMessageBatch({
      QueueUrl: this.url,
      Entries: entries,
    }).promise();
  }

  private sqs: AWS.SQS;

  private url: string;
}
