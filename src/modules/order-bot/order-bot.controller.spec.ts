import { Test, TestingModule } from '@nestjs/testing';
import { OrderBotController } from './order-bot.controller';

describe('OrderBotController', () => {
  let controller: OrderBotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderBotController],
    }).compile();

    controller = module.get<OrderBotController>(OrderBotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
