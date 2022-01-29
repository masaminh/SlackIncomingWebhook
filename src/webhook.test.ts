/* eslint no-undef: 0, @typescript-eslint/no-explicit-any : 0 */
/* eslint @typescript-eslint/explicit-function-return-type: 0, @typescript-eslint/no-unused-vars: 0 */
/* eslint import/no-extraneous-dependencies: 0 */
import AWS from 'aws-sdk';
import axios, { AxiosInstance } from 'axios';
import { mocked } from 'ts-jest/utils';
import Webhook from './webhook';

jest.mock('aws-sdk');
jest.mock('axios');

test('create', async () => {
  const getParameterFunc = jest.fn();
  getParameterFunc.mockReturnValue({
    promise: () => {
      return {
        Parameter: {
          Value: 'https://example.com/'
        }
      };
    }
  });
  mocked(AWS.SSM).mockImplementationOnce((): any => {
    return {
      getParameter: getParameterFunc
    };
  });

  await Webhook.create('stage', 'webhookname');
  expect(getParameterFunc.mock.calls.length).toBe(1);
});

test('sendMessage success', async () => {
  mocked(AWS.SSM).mockImplementationOnce((): any => {
    return {
      getParameter: (param: any, callback: any) => {
        return {
          promise: () => {
            return {
              Parameter: {
                Value: 'https://example.com/'
              }
            };
          }
        };
      }
    };
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 200 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('Success');
});

test('sendMessage need retry', async () => {
  mocked(AWS.SSM).mockImplementationOnce((): any => {
    return {
      getParameter: (param: any, callback: any) => {
        return {
          promise: () => {
            return {
              Parameter: {
                Value: 'https://example.com/'
              }
            };
          }
        };
      }
    };
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 500 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('NeedRetry');
});

test('sendMessage not retry', async () => {
  mocked(AWS.SSM).mockImplementationOnce((): any => {
    return {
      getParameter: (param: any, callback: any) => {
        return {
          promise: () => {
            return {
              Parameter: {
                Value: 'https://example.com/'
              }
            };
          }
        };
      }
    };
  });

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({ status: 404 });
  const webhook = await Webhook.create('stage', 'webhookname');
  const result = await webhook.sendMessage({ text: 'hello', blocks: [] });
  expect(result).toBe('NotSuccess');
});
