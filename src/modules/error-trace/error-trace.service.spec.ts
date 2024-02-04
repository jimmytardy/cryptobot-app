import { Test, TestingModule } from '@nestjs/testing';
import { ErrorTraceService } from './error-trace.service';

describe('ErrorTraceService', () => {
  let service: ErrorTraceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorTraceService],
    }).compile();

    service = module.get<ErrorTraceService>(ErrorTraceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
