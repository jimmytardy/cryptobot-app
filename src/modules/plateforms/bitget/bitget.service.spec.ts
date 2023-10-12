import { Test, TestingModule } from '@nestjs/testing';
import { BitgetService } from './bitget.service';

describe('BitgetService', () => {
  let service: BitgetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BitgetService],
    }).compile();

    service = module.get<BitgetService>(BitgetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
