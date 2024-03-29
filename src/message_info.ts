import logger from './logger';

interface InputMessageImageInfo {
  imageUrl: string;
  imageName: string;
}

function isInputMessageImageInfo(arg: any): arg is InputMessageImageInfo {
  return typeof arg.imageUrl === 'string' && typeof arg.imageName === 'string';
}

interface InputMessageInfo {
  webhookname: string;
  message: string;
  images?: InputMessageImageInfo[];
}

function isInputMessageInfo(arg: any): arg is InputMessageInfo {
  if (typeof arg.webhookname !== 'string' || typeof arg.message !== 'string') {
    return false;
  }

  if (arg.images != null) {
    if (!Array.isArray(arg.images)) {
      return false;
    }

    if (!arg.images.every((x: any) => isInputMessageImageInfo(x))) {
      return false;
    }
  }

  return true;
}

interface MessagePayloadSection {
  type: 'section';
  text: {
    type: 'mrkdwn';
    text: string;
  };
}

interface MessagePayloadImage {
  type: 'image';
  image_url: string;
  alt_text: string;
}

type MessagePayloadBlock = MessagePayloadSection | MessagePayloadImage;
export interface MessagePayload {
  text: string;
  blocks: MessagePayloadBlock[];
}

export default class MessageInfo {
  private webhookname = '';

  private message = '';

  private images: InputMessageImageInfo[] = [];

  public constructor(messageBody: string) {
    logger.info(`received message: ${JSON.stringify(messageBody)}`);
    try {
      const messageInfo = JSON.parse(messageBody);
      if (!isInputMessageInfo(messageInfo)) {
        logger.error(`Bad format: ${messageBody}`);
        return;
      }

      this.webhookname = messageInfo.webhookname;
      this.message = messageInfo.message;
      this.images = messageInfo.images ?? [];
    } catch (error) {
      logger.error(`JSON.parse error: ${error}`);
    }
  }

  public getWebhookName(): string {
    return this.webhookname;
  }

  public getMessage(): MessagePayload {
    const blocks: MessagePayloadBlock[] = this.images.reduce(
      (acc: MessagePayloadBlock[], cur) => {
        acc.push({
          type: 'image',
          image_url: cur.imageUrl,
          alt_text: cur.imageName,
        });
        return acc;
      },
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: this.message,
          },
        },
      ],
    );
    return {
      text: this.message,
      blocks,
    };
  }
}
