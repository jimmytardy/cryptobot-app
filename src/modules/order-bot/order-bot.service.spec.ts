import { Test, TestingModule } from '@nestjs/testing';
import { OrderBotService } from './order-bot.service';

describe('OrderBotService', () => {
  let service: OrderBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderBotService],
    }).compile();

    service = module.get<OrderBotService>(OrderBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
