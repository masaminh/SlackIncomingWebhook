import type { SQSEvent, Context } from 'aws-lambda';
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
    testName                    | contains | webhookName | sendMessageResult | calledSend
    ${'Success'}                | ${false} | ${'ABC'}    | ${'Success'}      | ${1}
    ${'Already used messageId'} | ${true}  | ${'ABC'}    | ${'Success'}      | ${0}
    ${'Empty whebhookname'}     | ${false} | ${''}       | ${'Success'}      | ${0}
    ${'Send error'}             | ${false} | ${'ABC'}    | ${'NeedRetry'}    | ${1}
  `('handler: $testName', async ({
    _testName, contains, webhookName, sendMessageResult, calledSend,
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

    const event = {
      Records: [{
        body: 'BODY',
        messageId: 'MESSAGEID',
      }],
    } as SQSEvent;

    const MockContext = jest.fn<Context, []>();
    const context = new MockContext();

    await handler(event, context, () => {});

    expect(sendMessageMock).toHaveBeenCalledTimes(calledSend);
  });

  it('error occured', async () => {
    const UsedMessageIdsMock = UsedMessageIds as jest.Mock;

    UsedMessageIdsMock.mockImplementation(() => ({
      contains: async () => { throw new Error(); },
    }));
    const sendMessageMock = jest.fn(() => Promise.resolve('Success'));
    const webhookMock = {
      sendMessage: sendMessageMock,
    } as unknown as Webhook;
    jest.spyOn(Webhook, 'create').mockImplementation(async () => webhookMock);

    const event = {
      Records: [{
        body: 'BODY',
        messageId: 'MESSAGEID',
      }],
    } as SQSEvent;

    const MockContext = jest.fn<Context, []>();
    const context = new MockContext();

    await handler(event, context, () => {});

    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});
