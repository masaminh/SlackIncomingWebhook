import logger from './logger';

export default class MessageInfo {
  private webhookname: string;

  private message: string;

  public constructor(messageBody: string) {
    try {
      const messageInfo = JSON.parse(messageBody);
      if (
        typeof messageInfo.webhookname === 'string' &&
        typeof messageInfo.message === 'string'
      ) {
        this.webhookname = messageInfo.webhookname;
        this.message = messageInfo.message;
        return;
      }

      logger.error(`Bad format: ${messageBody}`);
    } catch (error) {
      logger.error(`JSON.parse error: ${error}`);
    }

    this.webhookname = '';
    this.message = '';
  }

  public getWebhookName(): string {
    return this.webhookname;
  }

  public getMessage(): string {
    return this.message;
  }
}
