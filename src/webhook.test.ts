import AWS from 'aws-sdk';
import axios from 'axios';
import Webhook from './webhook';

jest.mock('aws-sdk');
jest.mock('axios');

const SSMMock = AWS.SSM as unknown as jest.Mock;

beforeAll(() => {
  jest.clearAllMocks();
});

test('create', async () => {
  const getParameterFunc = jest.fn();
  getParameterFunc.mockReturnValue({
    promise: () => ({
      Parameter: {
        Value: 'https://example.com/',
      },
    }),
  });
  SSMMock.mockImplementationOnce((): any => ({
    getParameter: getParameterFunc,
  }));

  await Webhook.create('stage', 'webhookname');
  expect(getParameterFunc.mock.calls.length).toBe(1);
});

test('sendMessage success', async () => {
  SSMMock.mockImplementationOnce((): any => ({
    getParameter: (_param: any, _callback: any) => ({
      promise: () => ({
        Parameter: {
          Value: 'https://example.com/',
        },
      }),
    }),
  }));

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 200 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('Success');
});

test('sendMessage need retry', async () => {
  SSMMock.mockImplementationOnce((): any => ({
    getParameter: (_param: any, _callback: any) => ({
      promise: () => ({
        Parameter: {
          Value: 'https://example.com/',
        },
      }),
    }),
  }));

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 500 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('NeedRetry');
});

test('sendMessage not retry', async () => {
  SSMMock.mockImplementationOnce((): any => ({
    getParameter: (_param: any, _callback: any) => ({
      promise: () => ({
        Parameter: {
          Value: 'https://example.com/',
        },
      }),
    }),
  }));

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 404 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('NotSuccess');
});
