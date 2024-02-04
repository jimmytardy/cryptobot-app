import { Test, TestingModule } from '@nestjs/testing';
import { TakeProfitService } from './take-profit.service';

describe('TakeProfitService', () => {
  let service: TakeProfitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TakeProfitService],
    }).compile();

    service = module.get<TakeProfitService>(TakeProfitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
