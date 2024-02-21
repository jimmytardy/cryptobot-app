import { Test, TestingModule } from '@nestjs/testing';
import { RightService } from './right.service';

describe('RightService', () => {
  let service: RightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RightService],
    }).compile();

    service = module.get<RightService>(RightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
