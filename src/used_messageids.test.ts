/* eslint no-undef: 0, @typescript-eslint/no-explicit-any : 0 */
/* eslint @typescript-eslint/explicit-function-return-type: 0, @typescript-eslint/no-unused-vars: 0 */
/* eslint import/no-extraneous-dependencies: 0 */
import AWS from 'aws-sdk';
import { DateTime } from 'luxon';
import { mocked } from 'ts-jest/utils';
import UsedMessageIds from './used_messageids';

jest.mock('aws-sdk');

test('not contained messageid', async () => {
  mocked(AWS.DynamoDB.DocumentClient).mockImplementationOnce((): any => {
    return {
      get: (param: any, callback: any) => {
        return {
          promise: () => {
            return {
              Item: undefined
            };
          }
        };
      }
    };
  });

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  const result = await usedMessageIds.contains('ABC');
  expect(result).toBe(false);
});

test('contained messageid', async () => {
  mocked(AWS.DynamoDB.DocumentClient).mockImplementationOnce((): any => {
    return {
      get: (param: any, callback: any) => {
        return {
          promise: () => {
            return {
              Item: {
                MessageId: 'ABC',
                TTL: 1000
              }
            };
          }
        };
      }
    };
  });

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  const result = await usedMessageIds.contains('ABC');
  expect(result).toBe(true);
});

test('add', async () => {
  const putFunc = jest.fn();
  putFunc.mockReturnValue({
    promise: () => {
      return {};
    }
  });
  mocked(AWS.DynamoDB.DocumentClient).mockImplementationOnce((): any => {
    return {
      put: putFunc
    };
  });

  const usedMessageIds = new UsedMessageIds('TABLE_NAME');
  usedMessageIds.add('ABC', DateTime.fromISO('2020-01-01T00:00:00Z'));
  expect(putFunc.mock.calls.length).toBe(1);
});
