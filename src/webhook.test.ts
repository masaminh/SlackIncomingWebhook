import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import axios from 'axios';
import Webhook from './webhook';
import logger from './logger';

jest.mock('axios');
jest.mock('./logger');

const SSMMock = mockClient(SSMClient);

beforeEach(() => {
  SSMMock.reset();
  jest.resetAllMocks();
});

test('create', async () => {
  SSMMock.on(GetParameterCommand).resolves({
    Parameter: {
      Value: 'https://example.com/',
    },
  });

  await Webhook.create('stage', 'webhookname');
  expect(SSMMock.commandCalls(GetParameterCommand)).toHaveLength(1);
});

test('sendMessage success', async () => {
  SSMMock.on(GetParameterCommand).resolvesOnce({
    Parameter: {
      Value: 'https://example.com/',
    },
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 200 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('Success');
});

test('sendMessage need retry', async () => {
  SSMMock.on(GetParameterCommand).resolvesOnce({
    Parameter: {
      Value: 'https://example.com/',
    },
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 500 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('NeedRetry');
});

test('sendMessage not retry', async () => {
  SSMMock.on(GetParameterCommand).resolvesOnce({
    Parameter: {
      Value: 'https://example.com/',
    },
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 404 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('NotSuccess');
});

test('sendMessage does not log webhook url', async () => {
  SSMMock.on(GetParameterCommand).resolvesOnce({
    Parameter: {
      Value: 'https://hooks.slack.com/services/SECRET',
    },
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValueOnce({ status: 200 });
  mockedAxios.post.mockResolvedValueOnce({ status: 500 });
  const webhook = await Webhook.create('stage', 'webhookname');
  await webhook.sendMessage({ text: 'hello', blocks: [] });
  await webhook.sendMessage({ text: 'hello', blocks: [] });

  const mockedLogger = logger as jest.Mocked<typeof logger>;
  const logged = [
    ...mockedLogger.info.mock.calls,
    ...mockedLogger.error.mock.calls,
  ].map((args) => args[0]);
  expect(logged).toHaveLength(2);
  logged.forEach((m) => {
    expect(m).not.toContain('hooks.slack.com');
    expect(m).toContain('webhook=webhookname');
  });
});
