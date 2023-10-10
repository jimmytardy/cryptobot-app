import { Test, TestingModule } from '@nestjs/testing';
import { BitgetActionService } from './bitget-action.service';

describe('BitgetActionService', () => {
  let service: BitgetActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BitgetActionService],
    }).compile();

    service = module.get<BitgetActionService>(BitgetActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
