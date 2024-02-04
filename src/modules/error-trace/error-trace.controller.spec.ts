import { Test, TestingModule } from '@nestjs/testing';
import { ErrorTraceController } from './error-trace.controller';

describe('ErrorTraceController', () => {
  let controller: ErrorTraceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorTraceController],
    }).compile();

    controller = module.get<ErrorTraceController>(ErrorTraceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
