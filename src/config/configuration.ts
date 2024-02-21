export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        name: process.env.DATABASE_NAME,
        uri: process.env.DATABASE_URI,
        port: parseInt(process.env.DATABASE_PORT, 10) || 27017
    },
    bitget: {
        apiKey: process.env.BITGET_API_KEY,
        secretKey: process.env.BITGET_API_SECRET_KEY,
        passphrase: process.env.BITGET_API_PASS,
    },
    jwtSecret: process.env.JWT_SECRET,
    stripeSecret: process.env.STRIPE_SECRET,
    telegrameClientBuildPath: process.env.TELEGRAM_CLIENT_PATH,
});