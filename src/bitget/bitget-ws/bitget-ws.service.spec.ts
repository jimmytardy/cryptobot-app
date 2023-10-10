import { Test, TestingModule } from '@nestjs/testing';
import { BitgetWsService } from './bitget-ws.service';

describe('BitgetWsService', () => {
  let service: BitgetWsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BitgetWsService],
    }).compile();

    service = module.get<BitgetWsService>(BitgetWsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
