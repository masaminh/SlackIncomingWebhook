// eslint-disable-next-line import/no-extraneous-dependencies
import { ScheduledEvent, Context } from 'aws-lambda';
import { handler } from './app';
import UsedMessageIds from './used_messageids';
import MessageInfo from './message_info';
import Webhook from './webhook';
import Queue from './queue';

jest.mock('./used_messageids');
jest.mock('./message_info');
jest.mock('./webhook');
jest.mock('./queue');
jest.mock('./logger');

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each`
    testName                    | contains | webhookName | sendMessageResult | calledSend | calledDelete
    ${'Success'}                | ${false} | ${'ABC'}    | ${'Success'}      | ${1}       | ${1}
    ${'Already used messageId'} | ${true}  | ${'ABC'}    | ${'Success'}      | ${0}       | ${1}
    ${'Empty whebhookname'}     | ${false} | ${''}       | ${'Success'}      | ${0}       | ${1}
    ${'Send error'}             | ${false} | ${'ABC'}    | ${'NeedRetry'}    | ${1}       | ${0}
  `('handler: $testName', async ({
    _testName, contains, webhookName, sendMessageResult, calledSend, calledDelete,
  }) => {
    const UsedMessageIdsMock = UsedMessageIds as jest.Mock;
    const MessageInfoMock = MessageInfo as jest.Mock;
    const QueueMock = Queue as jest.Mock;

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

    const deleteMessagesMock = jest.fn(() => Promise.resolve());

    QueueMock.mockImplementation(() => ({
      receiveMessages: () => Promise.resolve(
        [{ messageId: 'MESSAGEID', body: 'BODY', handle: 'HANDLE' }],
      ),
      deleteMessages: deleteMessagesMock,
    }));

    const MockEvent = jest.fn<ScheduledEvent, []>();
    const event = new MockEvent();

    const MockContext = jest.fn<Context, []>();
    const context = new MockContext();

    await handler(event, context, () => {});

    expect(sendMessageMock).toBeCalledTimes(calledSend);
    expect(deleteMessagesMock).toBeCalledTimes(calledDelete);
  });
});
