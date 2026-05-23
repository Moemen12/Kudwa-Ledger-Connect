import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  it('returns a safe health response', () => {
    expect(healthController.getStatus()).toEqual({
      ok: true,
      data: {
        service: 'kudwa-ledger-connect-api',
        status: 'ok',
      },
    });
  });
});
