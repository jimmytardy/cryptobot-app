import { Test, TestingModule } from '@nestjs/testing';
import { StopLossService } from './stop-loss.service';

describe('StopLossService', () => {
  let service: StopLossService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StopLossService],
    }).compile();

    service = module.get<StopLossService>(StopLossService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
