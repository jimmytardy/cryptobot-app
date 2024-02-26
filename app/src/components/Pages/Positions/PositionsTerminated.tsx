// import { useState } from 'react'
// import { IPosition, IUserOrder } from '.'
// import axiosClient from '../../../axiosClient'

const PositionsTerminated = () => {
    // const [isLoading, setIsLoading] = useState<boolean>(true)
    // const [positions, setPositions] = useState<IUserOrder[]>()

    // const loadPositions = async () => {
    //     setIsLoading(true)
    //     const ordersResults = await axiosClient.get<IUserOrder[]>('/bitget/orders-terminated')
    //     const newPositions: IPosition = {}
    //     for (const order of ordersResults.data) {
    //         if (order.linkOrderId) {
    //             if (!order.linkOrderId) {
    //                 newPositions[order.orderId] = [order]
    //             } else {
    //                 if (!newPositions[order.linkOrderId]) {
    //                     newPositions[order.linkOrderId] = []
    //                 }
    //                 newPositions[order.linkOrderId].push(order)
    //             }
    //         }
    //     }
    //     // setPositions(newPositions)
    //     setIsLoading(false)
    // }
    return (
        <div>
            <h2>Positions terminés</h2>
            {/* <Container>
                <div className="positions">
                    {Object.entries(positionsProps).map(([key, orders]) => {
                        const order = orders[0]
                        const isPnLPositive = (order.side === 'long' && order.currentPrice > order.PE) || (order.side === 'short' && order.currentPrice < order.PE)

                        return <Position order={order} isPnLPositive={isPnLPositive} key={'positions-position-' + order._id} />
                    })}
                </div>
            </Container> */}
        </div>
    )
}

export default PositionsTerminated
