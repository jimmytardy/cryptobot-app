import { Test, TestingModule } from '@nestjs/testing'
import { BitgetFuturesService } from './bitget-futures.service'
import { FuturesHoldSide, FuturesSymbolRule, SymbolRules } from 'bitget-api'
import { Order } from 'src/model/Order'
import { Types } from 'mongoose'
import { mockOrderService } from 'src/mocks/services/orderService.mock'
import { OrderService } from 'src/modules/order/order.service'
import { StopLossService } from 'src/modules/order/stop-loss/stop-loss.service'
import { mockStopLossService } from 'src/mocks/services/stopLossService.mock'
import { TakeProfitService } from 'src/modules/order/take-profit/take-profit.service'
import { mockTakeProfitService } from 'src/mocks/services/takeProfitService.mock'
import { TakeProfit, TakeProfitDocument } from 'src/model/TakeProfit'
import { mockBitgetUtilsService } from 'src/mocks/services/bitgetUtilsService.mock'
import { createMockOrder } from 'src/mocks/models/order.model'
import { createMockOrderWS, createMockSymbolRules, mockFuturesClient, mockRestClientV2 } from 'src/mocks/libs/bitgetApi.mock'
import { before, create, take } from 'underscore'
import { createMockTakeProfit } from 'src/mocks/models/takeProfit.model'
import { TPSizeType, User } from 'src/model/User'
import { createMockOrderStrategy, createMockUser } from 'src/mocks/models/user.model'
import { BitgetUtilsService } from '../bitget-utils/bitget-utils.service'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import { StopLoss } from 'src/model/StopLoss'
import { createMockStopLoss } from 'src/mocks/models/stopLoss.mock'
import { ErrorTraceService } from 'src/modules/error-trace/error-trace.service'
import { mockErrorTraceService } from 'src/mocks/services/errorTraceService.mock'
import { mock } from 'node:test'

describe('BitgetFuturesService', () => {
    let service: BitgetFuturesService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BitgetFuturesService,
                {
                    provide: ErrorTraceService, // Assurez-vous d'importer correctement le service d'ordre
                    useValue: mockErrorTraceService,
                },
                {
                    provide: OrderService, // Assurez-vous d'importer correctement le service d'ordre
                    useValue: mockOrderService,
                },
                {
                    provide: BitgetUtilsService, // Assurez-vous d'importer correctement le service de bitget-utils
                    useValue: mockBitgetUtilsService,
                },
                {
                    provide: StopLossService, // Assurez-vous d'importer correctement le service de stop-loss
                    useValue: mockStopLossService,
                },
                {
                    provide: TakeProfitService, // Assurez-vous d'importer correctement le service de take-profit
                    useValue: mockTakeProfitService,
                },
            ],
        }).compile()

        service = module.get<BitgetFuturesService>(BitgetFuturesService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('setLeverage', () => {
        it('should set leverage successfully', async () => {
            const symbol = 'BTCUSDT'
            const newLeverage = 10
            const side: FuturesHoldSide = 'long'

            // Configurez le comportement simulé de setLeverage sur le mock
            mockFuturesClient.setLeverage.mockResolvedValueOnce(undefined)

            // Utilisez le mock au lieu de l'objet réel
            await service.setLeverage(mockFuturesClient, symbol, newLeverage, side)

            // Vérifiez si setLeverage a été appelé avec les bons arguments
            expect(mockFuturesClient.setLeverage).toHaveBeenCalledWith(symbol, 'USDT', '10', side)
        })
    })

    describe('setMarginMode', () => {
        it('should set margin mode successfully', async () => {
            const symbol = 'BTCUSDT'

            // Configurez le comportement simulé de setMarginMode sur le mock
            mockFuturesClient.setMarginMode.mockResolvedValueOnce(undefined)

            // Utilisez le mock au lieu de l'objet réel
            await service.setMarginMode(mockFuturesClient, symbol)

            // Vérifiez si setMarginMode a été appelé avec les bons arguments
            expect(mockFuturesClient.setMarginMode).toHaveBeenCalledWith(symbol, 'USDT', 'fixed')
        })
    })

    describe('placeOrderBitget', () => {
        let order: Order

        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder({ activated: false, terminated: false, sendToPlateform: false })
            mockFuturesClient.submitOrder.mockResolvedValue({ data: { orderId: '12345' } } as any)
        })

        it('should place limit order successfully', async () => {

            // Appelez la fonction
            await service.placeOrderBitget(mockFuturesClient, order)

            // Vérifiez si submitOrder a été appelé avec les bons arguments
            expect(mockFuturesClient.submitOrder).toHaveBeenCalledWith({
                marginCoin: order.marginCoin,
                orderType: 'limit',
                side: 'open_long',
                size: order.quantity.toString(),
                symbol: order.symbol,
                clientOid: order.clOrderId.toString(),
                price: order.PE.toString(),
            })
            expect(order.sendToPlateform).toBe(true)
            expect(order.orderId).toBe('12345')
            expect(mockOrderService.updateOne).toHaveBeenCalledWith(order, { new: true, upsert: true })
        })

        it('should place market order successfully', async () => {
            // Appelez la fonction
            await service.placeOrderBitget(mockFuturesClient, order, 'market')

            // Vérifiez si submitOrder a été appelé avec les bons arguments
            expect(mockFuturesClient.submitOrder).toHaveBeenCalledWith({
                marginCoin: order.marginCoin,
                orderType: 'market',
                side: 'open_long',
                size: order.quantity.toString(),
                symbol: order.symbol,
                clientOid: order.clOrderId.toString(),
            })
            expect(order.sendToPlateform).toBe(true)
            expect(order.orderId).toBe('12345')
            expect(mockOrderService.updateOne).toHaveBeenCalledWith(order, { new: true, upsert: true })
        })
        it('should not place order when order not sent to plateform', async () => {
            order.sendToPlateform = true
            // Appelez la fonction
            await service.placeOrderBitget(mockFuturesClient, order)

            // Vérifiez si submitOrder n'a pas été appelé
            expect(mockFuturesClient.submitOrder).not.toHaveBeenCalled()
            expect(mockOrderService.updateOne).not.toHaveBeenCalled()
        });

        it('should not place order when order is terminated', async () => {
            order.terminated = true
            // Appelez la fonction
            await service.placeOrderBitget(mockFuturesClient, order)

            // Vérifiez si submitOrder n'a pas été appelé
            expect(mockFuturesClient.submitOrder).not.toHaveBeenCalled()
            expect(mockOrderService.updateOne).not.toHaveBeenCalled()
        });

        it('should not place order when order is activated', async () => {
            order.activated = true
            // Appelez la fonction
            await service.placeOrderBitget(mockFuturesClient, order)

            // Vérifiez si submitOrder n'a pas été appelé
            expect(mockFuturesClient.submitOrder).not.toHaveBeenCalled()
            expect(mockOrderService.updateOne).not.toHaveBeenCalled()
        });

        it('should handle errors when placing order', async () => {
            // Configurez le comportement simulé pour les dépendances
            mockFuturesClient.submitOrder.mockRejectedValue(new Error('Failed to place order'))

            // Appelez la fonction
            await service.placeOrderBitget(mockFuturesClient, order)

            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockOrderService.updateOne).not.toHaveBeenCalled()
        })
    })

    describe('activeSL', () => {
        let order: Order

        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder()
        })

        it('should activate stop-loss', async () => {
            const totalQuantity = 20 // Remplacez par la valeur appropriée

            // Configurez le comportement simulé pour les dépendances
            mockOrderService.getQuantityAvailable.mockResolvedValue(totalQuantity)
            mockFuturesClient.submitStopOrder.mockResolvedValue({
                data: { orderId: '12345' },
            } as any)

            // Appelez la fonction activeSL
            await service.activeSL(mockFuturesClient, order)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockOrderService.getQuantityAvailable).toHaveBeenCalledWith(order._id, order)
            expect(mockFuturesClient.submitStopOrder).toHaveBeenCalledWith({
                symbol: order.symbol,
                size: totalQuantity.toString(),
                marginCoin: order.marginCoin,
                planType: 'loss_plan',
                triggerType: 'fill_price',
                triggerPrice: String(order.SL),
                holdSide: order.side,
                clientOid: expect.any(String),
            })
            expect(mockStopLossService.createFromOrder).toHaveBeenCalledWith(order, expect.any(Object), '12345')
        })

        it('should not activate stop-loss when totalQuantity is 0', async () => {
            const totalQuantity = 0 // Remplacez par la valeur appropriée

            // Configurez le comportement simulé pour la dépendance
            mockOrderService.getQuantityAvailable.mockResolvedValue(totalQuantity)

            // Appelez la fonction activeSL
            await service.activeSL(mockFuturesClient, order)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque totalQuantity est égal à 0
            expect(mockFuturesClient.submitStopOrder).not.toHaveBeenCalled()
            expect(mockStopLossService.createFromOrder).not.toHaveBeenCalled()
        })

        it('should handle errors when activating stop-loss', async () => {
            const totalQuantity = 20 // Remplacez par la valeur appropriée

            // Configurez le comportement simulé pour les dépendances
            mockOrderService.getQuantityAvailable.mockResolvedValue(totalQuantity)
            mockFuturesClient.submitStopOrder.mockRejectedValue(new Error('Failed to activate SL'))

            // Appelez la fonction
            try {
                await service.activeSL(mockFuturesClient, order)
                expect(true).toBe(false) // Ne doit pas arriver jusque cette ligne
            } catch (e) {
                // Vérifiez si le logger a été appelé pour l'erreur générée
                expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
                expect(mockStopLossService.createFromOrder).not.toHaveBeenCalled()
            }
        })
    })

    describe('cancelTakeProfit', () => {
        let takeProfit: TakeProfit

        beforeEach(() => {
            jest.resetAllMocks()
            takeProfit = createMockTakeProfit()
        })

        it('should delete take-profit when activated and not terminated', async () => {
            takeProfit.activated = true // Le take-profit est activé
            takeProfit.terminated = false // Le take-profit n'est pas terminé
            // Configurez le comportement simulé pour la dépendance
            mockFuturesClient.cancelPlanOrderTPSL.mockResolvedValue(undefined)

            // Appelez la fonction cancelTakeProfit
            await service.cancelTakeProfit(mockFuturesClient, takeProfit)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.cancelPlanOrderTPSL).toHaveBeenCalledWith({
                marginCoin: takeProfit.marginCoin,
                planType: 'profit_plan',
                symbol: takeProfit.symbol,
                clientOid: takeProfit.clOrderId.toString(),
                orderId: takeProfit.orderId,
            })
            expect(mockTakeProfitService.updateOne).toHaveBeenCalledWith({ ...takeProfit, terminated: true, cancelled: true })
        })

        it('should not delete take-profit when not activated', async () => {
            takeProfit.activated = false // Le take-profit n'est pas activé
            takeProfit.terminated = false // Le take-profit n'est pas terminé
            // Appelez la fonction cancelTakeProfit
            await service.cancelTakeProfit(mockFuturesClient, takeProfit)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le take-profit n'est pas activé
            expect(mockFuturesClient.cancelPlanOrderTPSL).not.toHaveBeenCalled()
            expect(mockTakeProfitService.updateOne).toHaveBeenCalledWith({ ...takeProfit, terminated: true, cancelled: true })
        })

        it('should not delete take-profit when terminated', async () => {
            takeProfit.terminated = true // Le take-profit est terminé
            // Appelez la fonction cancelTakeProfit
            await service.cancelTakeProfit(mockFuturesClient, takeProfit)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le take-profit est terminé
            expect(mockFuturesClient.cancelPlanOrderTPSL).not.toHaveBeenCalled()
            expect(mockTakeProfitService.updateOne).toHaveBeenCalledWith({ ...takeProfit, terminated: true, cancelled: true })
        })

        it('should delete take-profit when deleteTakeProfit is true', async () => {
            takeProfit.cancelled = true // Le take-profit est annulé
            // Appelez la fonction
            await service.cancelTakeProfit(mockFuturesClient, takeProfit, true)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.cancelPlanOrderTPSL).toHaveBeenCalledWith({
                marginCoin: takeProfit.marginCoin,
                planType: 'profit_plan',
                symbol: takeProfit.symbol,
                clientOid: takeProfit.clOrderId.toString(),
                orderId: takeProfit.orderId,
            })
            expect(mockTakeProfitService.deleteOne).toHaveBeenCalledWith({ _id: takeProfit._id })
            expect(mockTakeProfitService.updateOne).not.toHaveBeenCalled()
        })

        it('should handle errors when deleting take-profit with error', async () => {
            takeProfit.activated = true // Le take-profit est activé
            takeProfit.terminated = false // Le take-profit n'est pas terminé
            // Configurez le comportement simulé pour la dépendance
            mockFuturesClient.cancelPlanOrderTPSL.mockRejectedValue(new Error('Failed to delete TP'))

            // Appelez la fonction
            await service.cancelTakeProfit(mockFuturesClient, takeProfit)
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockTakeProfitService.updateOne).not.toHaveBeenCalled()
            expect(mockTakeProfitService.deleteOne).not.toHaveBeenCalled()
        })
    })

    describe('addTakeProfit', () => {
        let order: Order

        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder()
        })

        it('should add take-profit when order is activated and there is enough quantity available', async () => {
            order.activated = true // Le champ activated est défini sur true

            const triggerPrice = 9500
            const num = 1
            const quantity = 5

            const quantityAvailable = 10 // Remplacez par la valeur appropriée

            // Configurez le comportement simulé pour les dépendances
            mockOrderService.getQuantityAvailable.mockResolvedValue(quantityAvailable)
            mockFuturesClient.submitStopOrder.mockResolvedValue({
                data: { orderId: '12345' },
            } as any)

            // Appelez la fonction addTakeProfit
            await service.addTakeProfit(mockFuturesClient, order, triggerPrice, num, quantity)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.submitStopOrder).toHaveBeenCalledWith({
                symbol: order.symbol,
                marginCoin: order.marginCoin,
                planType: 'profit_plan',
                triggerPrice: triggerPrice.toString(),
                size: quantity.toString(),
                triggerType: 'fill_price',
                holdSide: order.side,
                clientOid: expect.any(String),
            })
            expect(mockTakeProfitService.createFromOrder).toHaveBeenCalledWith(order, triggerPrice, quantity, num, expect.any(Types.ObjectId), '12345')
        })

        it('should throw an error when order is not activated', async () => {
            order.activated = false // Le champ activated est défini sur false

            const triggerPrice = 9500
            const num = 1
            const quantity = 5

            try {
                // Appelez la fonction addTakeProfit et vérifiez si elle génère une erreur lorsque le champ activated est à false
                await service.addTakeProfit(mockFuturesClient, order, triggerPrice, num, quantity)
                expect(true).toBe(false) // Ne doit pas arriver jusque cette ligne
            } catch (error) {
                // Vérifiez que l'erreur est bien une chaîne de caractères
                expect(typeof error.message).toBe('string')
            }
        })

        it('should throw an error when there is not enough quantity available', async () => {
            const triggerPrice = 9500
            const num = 1
            const quantity = 15 // La quantité désirée est supérieure à la quantité disponible

            const quantityAvailable = 10 // Remplacez par la valeur appropriée

            // Configurez le comportement simulé pour les dépendances
            mockOrderService.getQuantityAvailable.mockResolvedValue(quantityAvailable)

            try {
                // Appelez la fonction addTakeProfit et vérifiez si elle génère une erreur lorsque la quantité désirée est supérieure à la quantité disponible
                await service.addTakeProfit(mockFuturesClient, order, triggerPrice, num, quantity)
                expect(true).toBe(false) // Ne doit pas arriver jusque cette ligne
            } catch (error) {
                // Vérifiez que l'erreur est bien une chaîne de caractères
                expect(typeof error.message).toBe('string')
                expect(mockFuturesClient.submitStopOrder).not.toHaveBeenCalled()
                expect(mockTakeProfitService.createFromOrder).not.toHaveBeenCalled()
            }
        })

        it('should handle errors when adding take-profit', async () => {
            order.activated = true // Le champ activated est défini sur true

            const triggerPrice = 9500
            const num = 1
            const quantity = 5

            const quantityAvailable = 10 // Remplacez par la valeur appropriée

            // Configurez le comportement simulé pour les dépendances
            mockOrderService.getQuantityAvailable.mockResolvedValue(quantityAvailable)
            mockFuturesClient.submitStopOrder.mockRejectedValue(new Error('Failed to add TP'))

            // Appelez la fonction
            await service.addTakeProfit(mockFuturesClient, order, triggerPrice, num, quantity)
            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockTakeProfitService.createFromOrder).not.toHaveBeenCalled()
        })
    })

    describe('activeTPs', () => {
        let order: Order
        let symbolRules: FuturesSymbolRule
        let user: User
        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder()
            symbolRules = createMockSymbolRules()
            user = createMockUser()
            service.addTakeProfit = jest.fn().mockResolvedValue(undefined)
            service.logger.error = jest.fn()
        })

        it('should activate take-profits for each TP size', async () => {
            const TPSize = [20, 20, 10] // Remplacez par les tailles de TP appropriées

            // Configurez le comportement simulé pour les dépendances
            mockBitgetUtilsService.caculateTPsToUse.mockReturnValue({ TPSize })
            mockOrderService.getQuantityAvailable.mockResolvedValue(10) // Assurez-vous d'ajuster la quantité disponible en conséquence

            // Appelez la fonction activeTPs
            await service.activeTPs(mockFuturesClient, user.preferences.order.TPSize, symbolRules, order)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockBitgetUtilsService.caculateTPsToUse).toHaveBeenCalledWith(order.TPs, order.quantity, user.preferences.order.TPSize, symbolRules, order.side)

            // Vous pouvez également vérifier si la fonction addTakeProfit a été appelée avec les bons arguments pour chaque TP
            expect(service.addTakeProfit).toHaveBeenCalledTimes(TPSize.length)

            for (let i = 0; i < TPSize.length; i++) {
                const size = TPSize[i]
                const TP = order.TPs[i]
                expect(service.addTakeProfit).toHaveBeenNthCalledWith(i + 1, mockFuturesClient, order, TP, i + 1, size)
            }
        })

        it('should throw an error when order is not activated', async () => {
            order.activated = false // Le champ activated est défini sur false
            try {
                // Appelez la fonction activeTPs et vérifiez si elle génère une erreur lorsque le champ activated est à false
                await service.activeTPs(mockFuturesClient, user.preferences.order.TPSize, symbolRules, order)
                expect(true).toBe(false) // Ne doit pas arriver jusque cette ligne
            } catch (error) {
                // Vérifiez que l'erreur est bien une chaîne de caractères
                expect(typeof error.message).toBe('string')
            }
        })

        it('should handle errors when adding take-profits', async () => {
            const TPSize = [20, 20, 10] // Remplacez par les tailles de TP appropriées

            // Configurez le comportement simulé pour les dépendances
            mockBitgetUtilsService.caculateTPsToUse.mockReturnValue({ TPSize })

            // Configurez le mock de addTakeProfit pour générer une erreur pour le deuxième TP (indice 1)
            service.addTakeProfit = jest
                .fn()
                .mockResolvedValueOnce({ data: { orderId: '1' } } as any)
                .mockRejectedValueOnce(new Error('Failed to add TP'))

            // Appelez la fonction activeTPs et vérifiez si elle gère correctement les erreurs
            await service.activeTPs(mockFuturesClient, user.preferences.order.TPSize, symbolRules, order)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(service.addTakeProfit).toHaveBeenCalledTimes(TPSize.length)

            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
        })
    })

    describe('upgradeStopLoss', () => {
        let order: Order
        let orderStrategy: IOrderStrategy
        let stopLoss: StopLoss
        let newStep = 3
        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder()
            orderStrategy = createMockOrderStrategy()
            stopLoss = createMockStopLoss({ activated: true, terminated: false })
            mockStopLossService.findOne.mockResolvedValue(stopLoss)
            mockStopLossService.getNewStep.mockReturnValue(newStep)
            mockOrderService.getSLTriggerFromStep.mockResolvedValue(9500)
            mockFuturesClient.modifyStopOrder.mockResolvedValue({ data: { orderId: stopLoss.orderId } } as any)
        })

        it('should upgrade stop-loss when stop-loss exists and is different', async () => {
            stopLoss.triggerPrice = 9000
            stopLoss.step = 2
            // Appelez la fonction upgradeStopLoss
            await service.upgradeStopLoss(mockFuturesClient, order, orderStrategy, 3)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.modifyStopOrder).toHaveBeenCalledWith({
                marginCoin: order.marginCoin,
                orderId: stopLoss.orderId,
                planType: 'loss_plan',
                symbol: order.symbol,
                triggerPrice: '9500',
            })
            expect(mockStopLossService.updateOne).toHaveBeenCalledWith({ ...stopLoss, step: newStep, triggerPrice: 9500 }, { new: true })
            expect(mockStopLossService.getNewStep).toHaveBeenCalledWith(3, orderStrategy)
            expect(mockOrderService.getSLTriggerFromStep).toHaveBeenCalledWith(order, newStep)
            expect(mockStopLossService.updateOne).toHaveBeenCalledAfter(mockFuturesClient.modifyStopOrder as any)
        })

        it('should not upgrade stop-loss when stop-loss exists and is the same', async () => {
            stopLoss.triggerPrice = 9500
            // Appelez la fonction
            await service.upgradeStopLoss(mockFuturesClient, order, orderStrategy, 3)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le stop-loss est le même
            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockStopLossService.updateOne).toHaveBeenCalledWith({ ...stopLoss, step: newStep }, { new: true })
        })

        it('should not upgrade stop-loss when stop-loss not exists', async () => {
            mockStopLossService.findOne.mockResolvedValue(undefined)

            // Appelez la fonction
            await service.upgradeStopLoss(mockFuturesClient, order, orderStrategy, 3)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le stop-loss n'existe pas
            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockStopLossService.updateOne).not.toHaveBeenCalled()
        })

        it('should handle errors when upgrading stop-loss', async () => {
            mockFuturesClient.modifyStopOrder.mockRejectedValue(new Error('Failed to upgrade SL'))

            // Appelez la fonction
            await service.upgradeStopLoss(mockFuturesClient, order, orderStrategy, 3)
            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockStopLossService.updateOne).not.toHaveBeenCalled()
        })
    })

    describe('updateStopLoss', () => {
        let order: Order
        let stopLoss: StopLoss
        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder({ sendToPlateform: true, activated: true, SL: 9000 })
            stopLoss = createMockStopLoss({ activated: true, terminated: false, triggerPrice: order.SL })
            mockStopLossService.findOne.mockResolvedValue(stopLoss)
            mockFuturesClient.modifyStopOrder.mockResolvedValue({ data: { orderId: stopLoss.orderId } } as any)
            mockStopLossService.updateOne.mockResolvedValue(stopLoss)
            mockOrderService.updateOne.mockResolvedValue(order)
            service.activeSL = jest.fn().mockResolvedValue(undefined)
            service.logger.error = jest.fn()
        })

        it('should update stop-loss when order is activated and sendToPlateform is true', async () => {
            // Appelez la fonction
            await service.updateStopLoss(mockFuturesClient, order, 9500)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockStopLossService.findOne).toHaveBeenCalledWith({ orderParentId: order._id, terminated: false })
            expect(mockFuturesClient.modifyStopOrder).toHaveBeenCalledWith({
                marginCoin: order.marginCoin,
                orderId: stopLoss.orderId,
                planType: 'loss_plan',
                symbol: order.symbol,
                triggerPrice: '9500',
                clientOid: stopLoss.clOrderId.toString(),
            })
            expect(mockStopLossService.updateOne).toHaveBeenCalledWith({ ...stopLoss, triggerPrice: 9500 }, { new: true })
            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, SL: 9500 })
        })

        it('should not update stop-loss when order is not activated', async () => {
            order.activated = false
            // Appelez la fonction
            await service.updateStopLoss(mockFuturesClient, order, 9500)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ activated est à false
            expect(mockStopLossService.findOne).not.toHaveBeenCalled()
            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockStopLossService.updateOne).not.toHaveBeenCalled()

            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, SL: 9500 })
        })

        it('should not update stop-loss when sendToPlateform is false', async () => {
            order.sendToPlateform = false
            // Appelez la fonction
            await service.updateStopLoss(mockFuturesClient, order, 9500)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ sendToPlateform est à false
            expect(mockStopLossService.findOne).not.toHaveBeenCalled()
            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockStopLossService.updateOne).not.toHaveBeenCalled()

            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, SL: 9500 })
        })

        it('should not update stop-loss when stop-loss not exists', async () => {
            mockStopLossService.findOne.mockResolvedValue(undefined)
            // Appelez la fonction
            await service.updateStopLoss(mockFuturesClient, order, 9500)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le stop-loss n'existe pas
            expect(service.activeSL).toHaveBeenCalledWith(mockFuturesClient, order)

            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockStopLossService.updateOne).not.toHaveBeenCalled()

            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, SL: 9500 })
        })

        it('should handle errors when updating stop-loss', async () => {
            mockFuturesClient.modifyStopOrder.mockRejectedValue(new Error('Failed to update SL'))
            // Appelez la fonction

            await service.updateStopLoss(mockFuturesClient, order, 9500)
            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockStopLossService.updateOne).not.toHaveBeenCalled()
        })
    })

    describe('updateTakeProfit', () => {
        let order: Order
        let takeProfit: TakeProfit
        let stopLoss: StopLoss

        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder({ sendToPlateform: true, activated: true })
            takeProfit = createMockTakeProfit({ activated: true, terminated: false, triggerPrice: 9300, num: 5 })
            stopLoss = createMockStopLoss({ activated: true, terminated: false, triggerPrice: 9000 })
            mockStopLossService.findOne.mockResolvedValue(stopLoss)
            mockTakeProfitService.findOne.mockResolvedValue(takeProfit)
            mockFuturesClient.modifyStopOrder.mockResolvedValue({ data: { orderId: takeProfit.orderId } } as any)
            mockTakeProfitService.updateOne.mockResolvedValue(takeProfit)
            service.addTakeProfit = jest.fn().mockResolvedValue(undefined)
            service.cancelTakeProfit = jest.fn().mockResolvedValue(undefined)
            service.logger.error = jest.fn()
        })

        it('should update take-profit when order is activated and sendToPlateform is true and not update SL when is not good step', async () => {
            // Appelez la fonction
            await service.updateTakeProfit(mockFuturesClient, order, 9500, takeProfit)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.modifyStopOrder).toHaveBeenCalledTimes(1)
            expect(mockFuturesClient.modifyStopOrder).toHaveBeenCalledWith({
                marginCoin: order.marginCoin,
                orderId: takeProfit.orderId,
                planType: 'profit_plan',
                symbol: order.symbol,
                triggerPrice: '9500',
                clientOid: takeProfit.clOrderId.toString(),
            })
            expect(mockTakeProfitService.updateOne).toHaveBeenCalledWith({ ...takeProfit, triggerPrice: 9500 })
            expect(mockStopLossService.updateOne).not.toHaveBeenCalled()
        })

        it('should update take-profit when order is activated and sendToPlateform is true and update SL when is good step', async () => {
            takeProfit.triggerPrice = stopLoss.triggerPrice
            // Appelez la fonction
            await service.updateTakeProfit(mockFuturesClient, order, 9500, takeProfit)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.modifyStopOrder).toHaveBeenCalledTimes(2)
            expect(mockFuturesClient.modifyStopOrder).toHaveBeenCalledWith({
                marginCoin: order.marginCoin,
                orderId: takeProfit.orderId,
                planType: 'profit_plan',
                symbol: order.symbol,
                triggerPrice: '9500',
                clientOid: takeProfit.clOrderId.toString(),
            })
            expect(mockFuturesClient.modifyStopOrder).toHaveBeenCalledWith({
                marginCoin: order.marginCoin,
                orderId: stopLoss.orderId,
                planType: 'loss_plan',
                symbol: order.symbol,
                triggerPrice: '9500',
                clientOid: stopLoss.clOrderId.toString(),
            })
            expect(mockTakeProfitService.updateOne).toHaveBeenCalledWith({ ...takeProfit, triggerPrice: 9500 })
            expect(mockStopLossService.updateOne).toHaveBeenCalledWith({ ...stopLoss, triggerPrice: 9500, orderId: takeProfit.orderId })
        })

        it('should not update take-profit when order is not activated', async () => {
            order.activated = false
            // Appelez la fonction
            await service.updateTakeProfit(mockFuturesClient, order, 9500, takeProfit)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ activated est à false
            expect(mockTakeProfitService.findOne).not.toHaveBeenCalled()
            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockTakeProfitService.updateOne).not.toHaveBeenCalled()
        })

        it('should not update take-profit when sendToPlateform is false', async () => {
            order.sendToPlateform = false
            // Appelez la fonction
            await service.updateTakeProfit(mockFuturesClient, order, 9500, takeProfit)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ sendToPlateform est à false
            expect(mockTakeProfitService.findOne).not.toHaveBeenCalled()
            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockTakeProfitService.updateOne).not.toHaveBeenCalled()
        })

        it('should not update take-profit when take-profit not exists', async () => {
            mockTakeProfitService.findOne.mockResolvedValue(undefined)
            // Appelez la fonction
            await service.updateTakeProfit(mockFuturesClient, order, 9500, undefined)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le take-profit n'existe pas
            expect(mockFuturesClient.modifyStopOrder).not.toHaveBeenCalled()
            expect(mockTakeProfitService.updateOne).not.toHaveBeenCalled()
        })

        it('should handle errors when updating take-profit', async () => {
            mockFuturesClient.modifyStopOrder.mockRejectedValue(new Error('Failed to update TP'))
            // Appelez la fonction
            await service.updateTakeProfit(mockFuturesClient, order, 9500, takeProfit)

            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockTakeProfitService.updateOne).not.toHaveBeenCalled()
        })
    })

    describe('updateTakeProfits', () => {
        let order: Order
        let newTPs: number[]
        let TPSize: TPSizeType
        let symbolRules: FuturesSymbolRule
        let takeProfits: TakeProfit[]
        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder({ TPs: [9500, 9610, 9700], sendToPlateform: true, activated: true })
            takeProfits = [
                createMockTakeProfit({ terminated: false, num: 1, triggerPrice: 9500 }),
                createMockTakeProfit({ terminated: false, num: 2, triggerPrice: 9610 }),
                createMockTakeProfit({ terminated: false, num: 3, triggerPrice: 9700 }),
            ]
            newTPs = [9600, 9650, 9800]
            TPSize = {
                '1': [1],
                '2': [0.8, 0.2],
                '3': [0.3, 0.3, 0.4],
                '4': [0.25, 0.25, 0.25, 0.25],
            }
            symbolRules = createMockSymbolRules()

            mockBitgetUtilsService.getSymbolBy.mockResolvedValue(symbolRules)
            mockTakeProfitService.findAll.mockResolvedValue(takeProfits)
            mockOrderService.getQuantityAvailable.mockResolvedValue(order.quantity)
            mockBitgetUtilsService.caculateTPsToUse.mockReturnValue({ TPPrice: newTPs, TPSize: TPSize[2] })

            service.cancelTakeProfit = jest.fn().mockResolvedValue(undefined)
            service.addTakeProfit = jest.fn().mockResolvedValue(undefined)
            service.updateTakeProfit = jest.fn().mockResolvedValue(undefined)
        })

        it('should update take profits and order for an order with valid conditions when 0 TP is terminated', async () => {
            order.activated = true
            order.sendToPlateform = true

            // Appelez la fonction
            await service.updateTakeProfits(mockFuturesClient, order, newTPs, TPSize)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockTakeProfitService.findAll).toHaveBeenCalledWith({ orderParentId: order._id }, undefined, { sort: { num: 1 }, lean: true })
            expect(mockOrderService.getQuantityAvailable).toHaveBeenCalledWith(order._id, order)
            expect(mockBitgetUtilsService.caculateTPsToUse).toHaveBeenCalledWith(newTPs, order.quantity, TPSize, symbolRules, order.side)

            expect(service.cancelTakeProfit).not.toHaveBeenCalled()
            expect(service.addTakeProfit).not.toHaveBeenCalled()

            expect(service.updateTakeProfit).toHaveBeenCalledTimes(takeProfits.length)
            for (let i = 0; i < newTPs.length; i++) {
                expect(service.updateTakeProfit).toHaveBeenNthCalledWith(i + 1, mockFuturesClient, order, newTPs[i], takeProfits[i])
            }

            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, TPs: newTPs })
            expect(mockOrderService.updateOne).toHaveBeenCalledAfter(service.updateTakeProfit as any)
        })

        it('should update take profits and order for an order with valid conditions when 1 TP is terminated', async () => {
            order.activated = true
            order.sendToPlateform = true
            takeProfits[0].terminated = true
            const quantityAvailable = order.quantity - order.quantity * TPSize[3][0]
            const newTpsNotTerminated = newTPs.filter((tp, i) => !takeProfits[i].terminated)
            const takeProfitsNotTerminated = takeProfits.filter((tp) => !tp.terminated)

            mockOrderService.getQuantityAvailable.mockResolvedValue(quantityAvailable)
            mockBitgetUtilsService.caculateTPsToUse.mockReturnValue({ TPPrice: newTpsNotTerminated, TPSize: TPSize[2] })

            // Appelez la fonction
            await service.updateTakeProfits(mockFuturesClient, order, newTPs, TPSize)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockTakeProfitService.findAll).toHaveBeenCalledWith({ orderParentId: order._id }, undefined, { sort: { num: 1 }, lean: true })
            expect(mockOrderService.getQuantityAvailable).toHaveBeenCalledWith(order._id, order)
            expect(mockBitgetUtilsService.caculateTPsToUse).toHaveBeenCalledWith(newTpsNotTerminated, quantityAvailable, TPSize, symbolRules, order.side)
            for (let i = 0; i < newTpsNotTerminated.length; i++) {
                expect(service.cancelTakeProfit).toHaveBeenCalledBefore(service.addTakeProfit as any)
                expect(service.cancelTakeProfit).toHaveBeenNthCalledWith(i + 1, mockFuturesClient, takeProfitsNotTerminated[i], true)
                expect(service.addTakeProfit).toHaveBeenNthCalledWith(i + 1, mockFuturesClient, order, newTpsNotTerminated[i], takeProfitsNotTerminated[i].num, TPSize[2][i])
            }

            expect(service.updateTakeProfit).not.toHaveBeenCalled()

            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, TPs: newTpsNotTerminated })
        })

        it('should not update take profits and order for an order with invalid conditions', async () => {
            order.activated = false
            order.sendToPlateform = false
            // Appelez la fonction
            await service.updateTakeProfits(mockFuturesClient, order, newTPs, TPSize)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ activated est à false
            expect(mockTakeProfitService.findAll).not.toHaveBeenCalled()
            expect(mockOrderService.getQuantityAvailable).not.toHaveBeenCalled()
            expect(service.cancelTakeProfit).not.toHaveBeenCalled()
            expect(service.addTakeProfit).not.toHaveBeenCalled()
            expect(service.updateTakeProfit).not.toHaveBeenCalled()

            expect(mockBitgetUtilsService.caculateTPsToUse).toHaveBeenCalledWith(newTPs, order.quantity, TPSize, symbolRules, order.side)
            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, TPs: newTPs })
        })

        it('should handle errors when updating take-profits', async () => {
            mockTakeProfitService.findAll.mockRejectedValue(new Error('Failed to find TPs'))
            // Appelez la fonction
            await service.updateTakeProfits(mockFuturesClient, order, newTPs, TPSize)

            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(service.cancelTakeProfit).not.toHaveBeenCalled()
            expect(service.addTakeProfit).not.toHaveBeenCalled()
            expect(service.updateTakeProfit).not.toHaveBeenCalled()
            expect(mockOrderService.updateOne).not.toHaveBeenCalledWith({ ...order, TPs: newTPs })
        })
    })

    describe('updatePE', () => {
        let order: Order
        let newPE: number

        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder({ sendToPlateform: true, activated: false })
            newPE = 9500
            mockOrderService.updateOne.mockResolvedValue(order)
            service.logger.error = jest.fn()
        })

        it('should update PE when order is not activated and sendToPlateform is true', async () => {
            const oldOrder = { ...order }
            // Appelez la fonction
            await service.updatePE(mockFuturesClient, order, newPE)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.modifyOrder).toHaveBeenCalledWith({
                symbol: oldOrder.symbol,
                clientOid: oldOrder.clOrderId?.toString(),
                newClientOid: order.clOrderId?.toString(),
                price: String(newPE),
                size: oldOrder.quantity.toString(),
            })
            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...oldOrder, PE: newPE, clOrderId: order.clOrderId })
            expect(order.clOrderId).not.toEqual(oldOrder.clOrderId)
            expect(Types.ObjectId.isValid(order.clOrderId)).toBe(true)
        })

        it('should not update PE when order is activated and sendToPlateform is true', async () => {
            order.activated = true
            // Appelez la fonction
            await service.updatePE(mockFuturesClient, order, newPE)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockOrderService.updateOne).not.toHaveBeenCalled()
            expect(mockFuturesClient.modifyOrder).not.toHaveBeenCalled()
        })
    })

    describe('cancelOrder', () => {
        let order: Order
        beforeEach(() => {
            jest.resetAllMocks()
            order = createMockOrder({ terminated: false, activated: false, sendToPlateform: true })
            mockFuturesClient.cancelOrder.mockResolvedValue(undefined)
            service.logger.error = jest.fn()
        })

        it('should cancel order when order is not activated and sendToPlateform is true', async () => {
            // Appelez la fonction
            await service.cancelOrder(mockFuturesClient, order)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockFuturesClient.cancelOrder).toHaveBeenCalledWith(order.symbol, order.marginCoin, undefined, order.clOrderId?.toString())
            expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(order._id)
        })

        it('should not cancel order when order is not activated', async () => {
            order.activated = true
            // Appelez la fonction
            await service.cancelOrder(mockFuturesClient, order)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ activated est à false
            // TODO
        })

        it('should not cancel order when sendToPlateform is false', async () => {
            order.sendToPlateform = false
            // Appelez la fonction
            await service.cancelOrder(mockFuturesClient, order)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ sendToPlateform est à false
            expect(mockFuturesClient.cancelOrder).not.toHaveBeenCalled()
            expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(order._id)
        })

        it('should not update when order is terminated', async () => {
            order.terminated = true
            // Appelez la fonction
            await service.cancelOrder(mockFuturesClient, order)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ terminated est à true
            expect(mockFuturesClient.cancelOrder).not.toHaveBeenCalled()
            expect(mockOrderService.cancelOrder).not.toHaveBeenCalled()
        })

        it('should handle errors when cancelling order', async () => {
            order.terminated = false
            order.activated = false
            order.sendToPlateform = true
            mockFuturesClient.cancelOrder.mockRejectedValue(new Error('Failed to cancel order'))
            // Appelez la fonction
            await service.cancelOrder(mockFuturesClient, order)

            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockOrderService.cancelOrder).toHaveBeenCalled()
        })
    })

    describe('disabledOrderLink', () => {
        let orders: Order[]
        let linkId: Types.ObjectId
        let userId: Types.ObjectId
        beforeEach(() => {
            linkId = new Types.ObjectId()
            userId = new Types.ObjectId()
            jest.resetAllMocks()
            orders = [
                createMockOrder({ sendToPlateform: true, activated: false, linkOrderId: linkId, userId }),
                createMockOrder({ sendToPlateform: true, activated: false, linkOrderId: linkId, userId }),
            ]
            mockOrderService.findAll.mockResolvedValue(orders)
            service.logger.error = jest.fn()
        })

        it('should cancel and disable orders with valid conditions', async () => {
            // Call the disabledOrderLink method
            await service.disabledOrderLink(mockFuturesClient, linkId, userId)

            // Assert that the method behaves as expected
            expect(mockOrderService.findAll).toHaveBeenCalledWith({
                linkOrderId: linkId,
                terminated: false,
                activated: false,
                userId,
            })
            expect(mockFuturesClient.cancelOrder).toHaveBeenCalledTimes(orders.length)
            expect(mockOrderService.disabledOrderLink).toHaveBeenCalledWith(linkId, userId)
        })

        it('should handle the case when there are no orders to cancel', async () => {
            const orders = [] // No orders to cancel

            // Mock the findAll method to return an empty array
            mockOrderService.findAll.mockResolvedValue(orders)

            // Call the disabledOrderLink method
            await service.disabledOrderLink(mockFuturesClient, linkId, userId)

            // Assert that the method behaves as expected
            expect(mockOrderService.findAll).toHaveBeenCalledWith({
                linkOrderId: linkId,
                terminated: false,
                activated: false,
                userId,
            })
            expect(mockFuturesClient.cancelOrder).not.toHaveBeenCalled()
            expect(mockOrderService.disabledOrderLink).toHaveBeenCalledWith(linkId, userId)
        })
    })

    describe('activeOrder', () => {
        let order: Order
        let user: User
        let orderBitget: any
        let symbolRules: FuturesSymbolRule
        beforeEach(() => {
            jest.resetAllMocks()
            user = createMockUser()
            order = createMockOrder({ sendToPlateform: true, activated: false, userId: user._id, inActivation: true })
            orderBitget = createMockOrderWS()
            symbolRules = createMockSymbolRules()
            mockBitgetUtilsService.getSymbolBy.mockResolvedValue(symbolRules)
            mockOrderService.getOrderForActivation.mockResolvedValue(order)
            service.activeSL = jest.fn().mockResolvedValue(undefined)
            service.activeTPs = jest.fn().mockResolvedValue(undefined)
        })

        it('should active order when order is not activated and sendToPlateform is true', async () => {
            // Appelez la fonction
            await service.activeOrder(mockFuturesClient, order._id, user, orderBitget)

            // Vérifiez si les méthodes appropriées ont été appelées avec les bons arguments
            expect(mockOrderService.getOrderForActivation).toHaveBeenCalledWith(order._id, {
                PE: parseFloat(orderBitget.fillPx),
                quantity: parseFloat(orderBitget.fillSz),
                leverage: parseFloat(orderBitget.lever),
            })
            expect(service.activeSL).toHaveBeenCalledWith(mockFuturesClient, { ...order, activated: true, inActivation: false })
            expect(service.activeTPs).toHaveBeenCalledWith(mockFuturesClient, user.preferences.order.TPSize, symbolRules, {
                ...order,
                activated: true,
                inActivation: false,
            })
            expect(mockOrderService.updateOne).toHaveBeenCalledWith({ ...order, activated: true, inActivation: false })
        })

        it('should not active order when order is activated', async () => {
            order.activated = true
            // Appelez la fonction
            await service.activeOrder(mockFuturesClient, order._id, user, orderBitget)

            // Vérifiez si les méthodes appropriées n'ont pas été appelées lorsque le champ activated est à true
            expect(mockOrderService.getOrderForActivation).toHaveBeenCalled()
            expect(service.activeSL).not.toHaveBeenCalled()
            expect(service.activeTPs).not.toHaveBeenCalled()
            expect(mockOrderService.updateOne).not.toHaveBeenCalled()
        })

        it('should handle errors when activating order', async () => {
            mockOrderService.getOrderForActivation.mockRejectedValue(new Error('Failed to get order for activation'))
            // Appelez la fonction
            await service.activeOrder(mockFuturesClient, order._id, user, orderBitget)

            // Vérifiez si le logger a été appelé pour l'erreur générée
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(service.activeSL).not.toHaveBeenCalled()
            expect(service.activeTPs).not.toHaveBeenCalled()
            expect(mockOrderService.updateOne).not.toHaveBeenCalled()
        })
    })

    describe('closePosition', () => {
        let symbolRules: FuturesSymbolRule
        let userId: Types.ObjectId

        beforeEach(() => {
            jest.resetAllMocks()
            userId = new Types.ObjectId()
            symbolRules = createMockSymbolRules()
            mockRestClientV2.getFuturesPosition.mockResolvedValue({ data: [{ symbol: symbolRules.symbol }] } as any)
            mockBitgetUtilsService.convertSymbolToV2.mockReturnValue(symbolRules.symbol + 'V2')
        })

        it('should close position when order is activated and sendToPlateform is true', async () => {
            // Call the closePosition method
            await service.closePosition(mockRestClientV2, userId, symbolRules.symbol)

            // Assert that the method behaves as expected
            expect(mockRestClientV2.getFuturesPosition).toHaveBeenCalledWith({
                productType: 'USDT-FUTURES',
                symbol: symbolRules.symbol + 'V2',
                marginCoin: 'USDT',
            })
            expect(mockRestClientV2.futuresFlashClosePositions).toHaveBeenCalledWith({
                productType: 'USDT-FUTURES',
                symbol: symbolRules.symbol + 'V2',
            })
            expect(mockOrderService.closeAllOrderOnSymbol).toHaveBeenCalledWith(userId, symbolRules.symbol)
        })

        it('should not close position when not have position', async () => {
            mockRestClientV2.getFuturesPosition.mockResolvedValue({ data: [] } as any)
            // Call the closePosition method
            await service.closePosition(mockRestClientV2, userId, symbolRules.symbol)

            // Assert that the method behaves as expected
            expect(mockRestClientV2.getFuturesPosition).toHaveBeenCalled()
            expect(mockRestClientV2.futuresFlashClosePositions).not.toHaveBeenCalled()
            expect(mockOrderService.closeAllOrderOnSymbol).toHaveBeenCalled()
        })

        it('should handle errors when closing position', async () => {
            mockRestClientV2.getFuturesPosition.mockRejectedValue(new Error('Failed to get position'))
            // Call the closePosition method
            await service.closePosition(mockRestClientV2, userId, symbolRules.symbol)

            // Assert that the method behaves as expected
            expect(mockErrorTraceService.createErrorTrace).toHaveBeenCalled()
            expect(mockRestClientV2.futuresFlashClosePositions).not.toHaveBeenCalled()
            expect(mockOrderService.closeAllOrderOnSymbol).not.toHaveBeenCalled()
        })
    })
})
