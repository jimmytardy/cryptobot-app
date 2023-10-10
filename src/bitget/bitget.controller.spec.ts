import { Test, TestingModule } from '@nestjs/testing';
import { BitgetController } from './bitget.controller';

describe('BitgetController', () => {
  let controller: BitgetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BitgetController],
    }).compile();

    controller = module.get<BitgetController>(BitgetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
