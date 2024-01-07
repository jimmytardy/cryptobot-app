export interface AppConfigPayload {
    bot: {
        placeOrder: boolean
        updateOrder: boolean
        cancelOrder: boolean
    }
    syncOrdersBitget: {
        active: boolean
        lastUpdated: number
    }
}
