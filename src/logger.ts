import bunyan from 'bunyan';

const logger = bunyan.createLogger({ name: 'SlackIncomingWebHook' });
logger.level(bunyan.DEBUG);

export default class Logger {
  public static error(message: string): void {
    logger.error(message);
  }

  public static info(message: string): void {
    logger.info(message);
  }

  public static debug(message: string): void {
    logger.debug(message);
  }
}
