import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DateTime } from 'luxon';

export default class UsedMessageIds {
  private docClient: DynamoDBDocumentClient;

  private messageIdTableName: string;

  public constructor(tableName: string) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.messageIdTableName = tableName;
  }

  public async contains(messageId: string): Promise<boolean> {
    const command = new GetCommand({
      TableName: this.messageIdTableName,
      Key: { MessageId: messageId },
    });
    const data = await this.docClient.send(command);
    return data.Item !== undefined;
  }

  public async add(messageId: string, now: DateTime): Promise<void> {
    const tomorrow = now.plus({ days: 1 });
    const command = new PutCommand({
      TableName: this.messageIdTableName,
      Item: {
        MessageId: messageId,
        TTL: tomorrow.toUnixInteger(),
      },
    });
    await this.docClient.send(command);
  }
}
