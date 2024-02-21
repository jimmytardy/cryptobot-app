import { useEffect } from "react"
import Loader from "../../../utils/Loader"
import { useAuth } from "../../../../hooks/AuthContext"


const TelegramChannel = () => {
    const { token } = useAuth()
    useEffect(() => {
        window.location.href = window.location.origin + '/api/telegram/channel?token=' + token
    }, [])

    return <Loader />
}

export default TelegramChannel;