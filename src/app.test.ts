// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { handler } from './app';
import UsedMessageIds from './used_messageids';
import MessageInfo from './message_info';
import Webhook from './webhook';

jest.mock('./used_messageids');
jest.mock('./message_info');
jest.mock('./webhook');
jest.mock('./logger');

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each`
    testName                    | contains | webhookName | sendMessageResult | called | raiseError
    ${'Success'}                | ${false} | ${'ABC'}    | ${'Success'}      | ${1}   | ${false}
    ${'Already used messageId'} | ${true}  | ${'ABC'}    | ${'Success'}      | ${0}   | ${false}
    ${'Empty whebhookname'}     | ${false} | ${''}       | ${'Success'}      | ${0}   | ${false}
    ${'Send error'}             | ${false} | ${'ABC'}    | ${'NeedRetry'}    | ${1}   | ${true}
  `('handler: $testName', async ({
    _testName, contains, webhookName, sendMessageResult, called, raiseError,
  }) => {
    const UsedMessageIdsMock = UsedMessageIds as jest.Mock;
    const MessageInfoMock = MessageInfo as jest.Mock;

    UsedMessageIdsMock.mockImplementation(() => ({
      contains: async () => contains,
      add: async () => {},
    }));

    MessageInfoMock.mockImplementation(() => ({
      getWebhookName: () => webhookName,
      getMessage: () => ('hello'),
    }));

    const sendMessageMock = jest.fn(() => Promise.resolve(sendMessageResult));
    const webhookMock = {
      sendMessage: sendMessageMock,
    } as unknown as Webhook;

    jest.spyOn(Webhook, 'create').mockImplementation(async () => webhookMock);

    const MockSqsRecord = jest.fn<SQSRecord, []>();
    const record = new MockSqsRecord();
    record.body = '{"webhookname": "ABC", "message": "hello"}';
    const event: SQSEvent = {
      Records: [record],
    };
    const MockContext = jest.fn<Context, []>();
    const context = new MockContext();

    if (raiseError === true) {
      await expect(handler(event, context, () => {})).rejects.toThrowError();
    } else {
      await handler(event, context, () => {});
    }

    expect(sendMessageMock).toBeCalledTimes(called);
  });
});
