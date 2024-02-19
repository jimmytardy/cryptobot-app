import { Module, forwardRef } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from 'src/model/User'
import { SubscriptionSchema, Subscription } from 'src/model/Subscription'
import { PlateformsModule } from '../plateforms/plateforms.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Subscription.name, schema: SubscriptionSchema },
        ]),
        forwardRef(() => PlateformsModule),
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule {}
