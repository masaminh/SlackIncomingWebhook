import { DateTime } from 'luxon';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import UsedMessageIds from './used_messageids';

jest.mock('./logger');

const documentMockClient = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  documentMockClient.reset();
});

test('not contained messageid', async () => {
  documentMockClient.on(GetCommand).resolvesOnce({
    Item: undefined,
  });

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  const result = await usedMessageIds.contains('ABC');
  expect(result).toBe(false);
});

test('contained messageid', async () => {
  documentMockClient.on(GetCommand).resolvesOnce({
    Item: {
      MessageId: 'ABC',
      TTL: 1000,
    },
  });

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  const result = await usedMessageIds.contains('ABC');
  expect(result).toBe(true);
});

test('add', async () => {
  documentMockClient.on(PutCommand);

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  usedMessageIds.add('ABC', DateTime.fromISO('2020-01-01T00:00:00Z'));
  const callsOfGet = documentMockClient.commandCalls(PutCommand);
  expect(callsOfGet).toHaveLength(1);
});
