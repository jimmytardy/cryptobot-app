import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { PlateformsModule } from './plateforms/plateforms.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PaymentsModule } from './payment/payments.module';
import { TasksModule } from './tasks/tasks.module';
import { TelegramModule } from './telegram/telegram.module';
import { OrderBotService } from './order-bot/order-bot.service';
import { OrderBotModule } from './order-bot/order-bot.module';
import { AppConfigModule } from './app-config/app-config.module';
import { ErrorTraceModule } from './error-trace/error-trace.module';
import { PositionModule } from './position/position.module';
import { RightModule } from './right/right.module';
import { StrategyModule } from './strategy/strategy.module';

@Module({
  imports: [OrderModule, PlateformsModule, AuthModule, UserModule, PaymentsModule, TasksModule, TelegramModule, OrderBotModule, AppConfigModule, ErrorTraceModule, PositionModule, RightModule, StrategyModule]
})
export class ModulesModule {}
