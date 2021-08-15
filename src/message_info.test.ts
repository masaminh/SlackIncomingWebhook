/* eslint no-undef: 0 */

import MessageInfo from './message_info';

test.each`
  caseName                     | input                                                                                                          | webhookName | text
  ${'message'}                 | ${'{"webhookname": "A", "message": "B"}'}                                                                      | ${'A'}      | ${'B'}
  ${'blocks'}                  | ${'{"webhookname": "A", "message": "B", "images": [{"imageUrl": "http://example.com/", "imageName": "abc"}]}'} | ${'A'}      | ${'B'}
  ${'not json format'}         | ${'not json format'}                                                                                           | ${''}       | ${''}
  ${'not contain webhookname'} | ${'{"webhookname1": "A", "message": "B"}'}                                                                     | ${''}       | ${''}
  ${'not contain message'}     | ${'{"webhookname": "A", "message1": "B"}'}                                                                     | ${''}       | ${''}
`('$caseName', ({ input, webhookName, text }) => {
  const messageInfo = new MessageInfo(input);
  expect(messageInfo.getWebhookName()).toBe(webhookName);
  const message = messageInfo.getMessage();
  expect(message.text).toBe(text);
});
