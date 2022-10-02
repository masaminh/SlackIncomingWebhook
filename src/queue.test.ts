import AWS from 'aws-sdk';
import Queue from './queue';

jest.mock('./logger');

jest.mock('aws-sdk');
const SQSMock = AWS.SQS as unknown as jest.Mock;

const receiveMessageMock = jest.fn();
const deleteMessageBatchMock = jest.fn();

SQSMock.mockImplementation(() => ({
  receiveMessage: receiveMessageMock,
  deleteMessageBatch: deleteMessageBatchMock,
}));

describe('Queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('receiveMessages', async () => {
    receiveMessageMock.mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        Messages: [{ MessageId: 'ID', Body: 'BODY', ReceiptHandle: 'HANDLE' }],
      }),
    })).mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        Messages: [],
      }),
    }));

    const queue = new Queue('URL');
    const result = await queue.receiveMessages();

    expect(receiveMessageMock).toBeCalledTimes(2);
    expect(receiveMessageMock.mock.calls[0][0]).toEqual({
      QueueUrl: 'URL',
      MaxNumberOfMessages: 10,
    });
    expect(receiveMessageMock.mock.calls[0][0].WaitTimeSeconds).toBeUndefined();
    expect(receiveMessageMock.mock.calls[1][0]).toEqual({
      QueueUrl: 'URL',
      MaxNumberOfMessages: 10,
    });
    expect(receiveMessageMock.mock.calls[1][0].WaitTimeSeconds).toBeUndefined();
    expect(result).toHaveLength(1);
    expect(result[0].messageId).toBe('ID');
    expect(result[0].body).toBe('BODY');
    expect(result[0].handle).toBe('HANDLE');
  });

  it('receiveMessages: empty Messages', async () => {
    receiveMessageMock.mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        Messages: [{}],
      }),
    })).mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
        Messages: [],
      }),
    }));

    const queue = new Queue('URL');
    const result = await queue.receiveMessages();

    expect(result).toHaveLength(0);
  });

  it('receiveMessages: Messages: undefined', async () => {
    receiveMessageMock.mockImplementationOnce(() => ({
      promise: () => Promise.resolve({
      }),
    }));

    const queue = new Queue('URL');
    const result = await queue.receiveMessages();

    expect(result).toHaveLength(0);
  });

  it('deleteMessages', async () => {
    deleteMessageBatchMock.mockImplementation(() => ({
      promise: () => Promise.resolve({}),
    }));

    const queue = new Queue('URL');

    await queue.deleteMessages(['123', '456']);
    expect(deleteMessageBatchMock).toBeCalledTimes(1);

    const arg0 = deleteMessageBatchMock.mock.calls[0][0];

    const url = arg0.QueueUrl;
    expect(url).toBe('URL');

    const entries = arg0.Entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].ReceiptHandle).toBe('123');
    expect(entries[1].ReceiptHandle).toBe('456');
  });
});
