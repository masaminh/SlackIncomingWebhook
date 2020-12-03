/* eslint no-undef: 0 */

import MessageInfo from './message_info';

test('webhookname', () => {
  const messageInfo = new MessageInfo('{"webhookname": "A", "message": "B"}');
  expect(messageInfo.getWebhookName()).toBe('A');
});

test('message', () => {
  const messageInfo = new MessageInfo('{"webhookname": "A", "message": "B"}');
  expect(messageInfo.getMessage()).toBe('B');
});

test('not json format', () => {
  const messageInfo = new MessageInfo('not json format');
  expect(messageInfo.getWebhookName()).toBe('');
  expect(messageInfo.getMessage()).toBe('');
});

test('not contain webhookname', () => {
  const messageInfo = new MessageInfo('{"webhookname1": "A", "message": "B"}');
  expect(messageInfo.getWebhookName()).toBe('');
  expect(messageInfo.getMessage()).toBe('');
});

test('not contain message', () => {
  const messageInfo = new MessageInfo('{"webhookname": "A", "message1": "B"}');
  expect(messageInfo.getWebhookName()).toBe('');
  expect(messageInfo.getMessage()).toBe('');
});
