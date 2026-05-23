import { Injectable } from '@nestjs/common';
import { ok } from '../../lib/http/api-response';

@Injectable()
export class HealthService {
  getStatus() {
    return ok({
      service: 'kudwa-ledger-connect-api',
      status: 'ok',
    });
  }
}
