import { useEffect, useState } from 'react'
import Loader from '../../utils/Loader'
import { IPosition, IUserOrder } from '.'
import axiosClient from '../../../axiosClient'
import { Container } from 'react-bootstrap'
import Position from './Position'

interface IPositionsInProgressProps {
    positions?: IPosition
    setPositions: (positions: IPosition) => void
}

const PositionsInProgress = ({ positions: positionsProps, setPositions: setPositionsProps }: IPositionsInProgressProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const loadOrders = async () => {
        setIsLoading(true)
        const ordersResults = await axiosClient.get<IUserOrder[]>('/bitget/orders-active')
        const newPositions: IPosition = {}
        for (const order of ordersResults.data) {
            if (order.linkOrderId) {
                if (!order.linkOrderId) {
                    newPositions[order.orderId] = [order]
                } else {
                    if (!newPositions[order.linkOrderId]) {
                        newPositions[order.linkOrderId] = []
                    }
                    newPositions[order.linkOrderId].push(order)
                }
            }
        }
        setPositionsProps(newPositions)
        setIsLoading(false)
    }

    useEffect(() => {
        if (!positionsProps || Object.keys(positionsProps).length === 0) {
            loadOrders()
        } else {
            setIsLoading(false)
        }
    }, [positionsProps])

    if (isLoading || !positionsProps) return <Loader />

    return (
        <Container>
            <div className="positions">
                {Object.entries(positionsProps).map(([, orders]) => {
                    const order = orders[0]
                    const isPnLPositive = (order.side === 'long' && order.currentPrice > order.PE) || (order.side === 'short' && order.currentPrice < order.PE)

                    return <Position order={order} isPnLPositive={isPnLPositive} key={'positions-position-' + order._id} />
                })}
            </div>
        </Container>
    )
}

export default PositionsInProgress
