import bunyan from 'bunyan';

jest.mock('bunyan');

const errorFunc = jest.fn();
const infoFunc = jest.fn();
const debugFunc = jest.fn();

type LoggerType = ReturnType<typeof bunyan.createLogger>;

jest.spyOn(bunyan, 'createLogger').mockImplementation(() => ({
  error: errorFunc,
  info: infoFunc,
  debug: debugFunc,
  level: jest.fn(),
} as unknown as LoggerType));

const logger = require('./logger').default;

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('error', () => {
    logger.error('ABC');
    expect(errorFunc).toBeCalledTimes(1);
  });

  it('info', () => {
    logger.info('ABC');
    expect(infoFunc).toBeCalledTimes(1);
  });

  it('debug', () => {
    logger.debug('ABC');
    expect(debugFunc).toBeCalledTimes(1);
  });
});
