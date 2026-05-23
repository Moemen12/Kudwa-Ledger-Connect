import { ArgumentsHost } from '@nestjs/common';
import { ApplicationError } from '../../lib/errors/application-error';
import { ApplicationExceptionFilter } from './application-exception.filter';

describe('ApplicationExceptionFilter', () => {
  it('serializes application errors into the shared API failure shape', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    const filter = new ApplicationExceptionFilter();

    filter.catch(
      new ApplicationError('Bad source data.', 'BAD_SOURCE_DATA', 400, {
        fileName: 'example.json',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      ok: false,
      error: {
        code: 'BAD_SOURCE_DATA',
        message: 'Bad source data.',
        details: {
          fileName: 'example.json',
        },
      },
    });
  });
});
