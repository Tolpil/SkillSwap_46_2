import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service name', () => {
      expect(appController.getHello()).toBe('SkillSwap API is running');
    });
  });

  describe('health', () => {
    it('should return ok status with uptime and timestamp', () => {
      const health = appController.getHealth();

      expect(health.status).toBe('ok');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(new Date(health.timestamp).getTime()).not.toBeNaN();
    });
  });
});
