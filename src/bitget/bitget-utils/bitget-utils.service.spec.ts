import { Test, TestingModule } from '@nestjs/testing';
import { BitgetUtilsService } from './bitget-utils.service';

describe('BitgetUtilsService', () => {
  let service: BitgetUtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BitgetUtilsService],
    }).compile();

    service = module.get<BitgetUtilsService>(BitgetUtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
