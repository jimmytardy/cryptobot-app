import { useEffect } from "react"
import Loader from "../../../utils/Loader"


const TelegramChannel = () => {
    useEffect(() => {
        window.location.href = window.location.origin + '/api/telegram/channel'
    }, [])

    return <Loader />
}

export default TelegramChannel;