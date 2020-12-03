/* eslint @typescript-eslint/no-empty-function: 0 */
/* eslint no-undef: 0, @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/explicit-function-return-type: 0, @typescript-eslint/no-unused-vars: 0 */
/* eslint import/no-extraneous-dependencies: 0, import/no-unresolved: 0 */

import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { mocked } from 'ts-jest/utils';
import { handler } from './app';
import UsedMessageIds from './used_messageids';
import Webhook, { ResultType } from './webhook';

jest.mock('./used_messageids');
jest.mock('./webhook');

test('handler', async () => {
  const sendMessageFunc = jest.fn();
  sendMessageFunc.mockReturnValue(ResultType.Success);
  const WebhookCreateMock = jest.fn();
  WebhookCreateMock.mockReturnValue({
    sendMessage: sendMessageFunc
  });
  Webhook.create = WebhookCreateMock.bind(Webhook);
  const MockSqsRecord = jest.fn<SQSRecord, []>();
  const record = new MockSqsRecord();
  record.body = '{"webhookname": "ABC", "message": "hello"}';
  const event: SQSEvent = {
    Records: [record]
  };
  const MockContext = jest.fn<Context, []>();
  const context = new MockContext();
  await handler(event, context, () => {});
  expect(sendMessageFunc.mock.calls.length).toBe(1);
});
