import AWS from 'aws-sdk';
import { DateTime } from 'luxon';
import UsedMessageIds from './used_messageids';

jest.mock('./logger');

jest.mock('aws-sdk');
const DocumentClientMock = AWS.DynamoDB.DocumentClient as jest.Mock;

beforeAll(() => {
  jest.clearAllMocks();
});

test('not contained messageid', async () => {
  DocumentClientMock.mockImplementationOnce((): any => ({
    get: (_param: any, _callback: any) => ({
      promise: () => ({
        Item: undefined,
      }),
    }),
  }));

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  const result = await usedMessageIds.contains('ABC');
  expect(result).toBe(false);
});

test('contained messageid', async () => {
  DocumentClientMock.mockImplementationOnce((): any => ({
    get: (_param: any, _callback: any) => ({
      promise: () => ({
        Item: {
          MessageId: 'ABC',
          TTL: 1000,
        },
      }),
    }),
  }));

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  const result = await usedMessageIds.contains('ABC');
  expect(result).toBe(true);
});

test('add', async () => {
  const putFunc = jest.fn();
  putFunc.mockReturnValue({
    promise: () => ({}),
  });
  DocumentClientMock.mockImplementationOnce((): any => ({
    put: putFunc,
  }));

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  usedMessageIds.add('ABC', DateTime.fromISO('2020-01-01T00:00:00Z'));
  expect(putFunc.mock.calls.length).toBe(1);
});
