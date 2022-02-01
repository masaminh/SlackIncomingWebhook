import AWS from 'aws-sdk';
import { DateTime } from 'luxon';

export default class UsedMessageIds {
  private docClient: AWS.DynamoDB.DocumentClient;

  private messageIdTableName: string;

  public constructor(tableName: string) {
    this.docClient = new AWS.DynamoDB.DocumentClient();
    this.messageIdTableName = tableName;
  }

  public async contains(messageId: string): Promise<boolean> {
    const data = await this.docClient
      .get({
        TableName: this.messageIdTableName,
        Key: { MessageId: messageId },
      })
      .promise();

    return data.Item !== undefined;
  }

  public async add(messageId: string, now: DateTime): Promise<void> {
    const tomorrow = now.plus({ days: 1 });
    await this.docClient
      .put({
        TableName: this.messageIdTableName,
        Item: {
          MessageId: messageId,
          TTL: Math.floor(tomorrow.toMillis() / 1000),
        },
      })
      .promise();
  }
}
