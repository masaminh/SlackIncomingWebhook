// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { handler } from './app';
import Webhook from './webhook';

jest.mock('./used_messageids');
jest.mock('./webhook');

test('handler', async () => {
  const sendMessageFunc = jest.fn();
  sendMessageFunc.mockReturnValue('Success');
  const WebhookCreateMock = jest.fn();
  WebhookCreateMock.mockReturnValue({
    sendMessage: sendMessageFunc,
  });
  Webhook.create = WebhookCreateMock.bind(Webhook);
  const MockSqsRecord = jest.fn<SQSRecord, []>();
  const record = new MockSqsRecord();
  record.body = '{"webhookname": "ABC", "message": "hello"}';
  const event: SQSEvent = {
    Records: [record],
  };
  const MockContext = jest.fn<Context, []>();
  const context = new MockContext();
  await handler(event, context, () => {});
  expect(sendMessageFunc.mock.calls.length).toBe(1);
});
