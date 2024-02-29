import { User } from 'src/model/User'
import { faker } from '@faker-js/faker';
import { Types } from 'mongoose'
import { IOrderStrategy, SLStepEnum } from 'src/interfaces/order-strategy.interface';

export const createMockUser = (user: Partial<User> = {}): User => ({
    _id: new Types.ObjectId(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    active: true,
    bitget: {
        api_key: faker.internet.password(),
        api_pass: faker.internet.password(),
        api_secret_key: faker.internet.password(),
    },
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    isAdmin: false,
    preferences: {
        order: {
            TPSize: {
                1: [1],
                2: [0.5, 0.5],
                3: [0.25, 0.5, 0.25],
                4: [0.2, 0.3, 0.3, 0.2],
                5: [0.15, 0.2, 0.3, 0.2, 0.15],
                6: [0.1, 0.15, 0.25, 0.25, 0.15, 0.1],
            },
            quantity: 500,
            marginCoin: 'USDT',
            baseCoinAuthorized: undefined,
        },
    },
    subscription: undefined,
    stripeCustomerId: faker.string.uuid(),
    referralCode: faker.string.uuid(),
    referrer: undefined,
    ...user
})

export const createMockOrderStrategy = (orderStrategy: Partial<IOrderStrategy> = {}): IOrderStrategy => ({
    '0': SLStepEnum.Default,
    '1': SLStepEnum.PE_BAS,
    '2': SLStepEnum.PE_HAUT,
    '3': SLStepEnum.TP1,
    '4': SLStepEnum.TP2,
    ...orderStrategy
})
