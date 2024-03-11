import { useFormContext } from 'react-hook-form'
import { IPreferencePayload } from '..'
import { Col, Row } from 'react-bootstrap'
import InputBaseCoin from '../../../utils/form/InputInputBaseCoin'
import './index.scss'
import { X } from 'react-bootstrap-icons'

const BaseCoinAuthorized = () => {
    const { watch, setValue, getValues } = useFormContext<IPreferencePayload>()
    const coins = watch('bot.baseCoinAuthorized')
    const addCoin = (coin: string) => {
        const currentCoins = getValues('bot.baseCoinAuthorized')
        setValue('bot.baseCoinAuthorized', [...(currentCoins || []), coin])
    }

    const removeCoin = (coin: string) => {
        const currentCoins = getValues('bot.baseCoinAuthorized')
        const newCoin = currentCoins?.filter((c) => c !== coin);
        setValue('bot.baseCoinAuthorized', newCoin?.length === 0 ? undefined : newCoin)
    }
    return (
        <Row className="basecoin-authorized">
            <div className="form-title">Limiter les trades à certaines cryptomonnaies spécifiques</div>
            <Row>
                <Col xs={12}>
                    <InputBaseCoin baseCoinExcluded={coins} onSelect={addCoin} />
                </Col>
                <div className="coin-list">
                    {!coins && <span>Toutes les cryptos sont autorisées</span>}
                    {coins?.map((coin: string) => (
                        <span className="coin-item" key={coin}>
                            {coin}
                            <X onClick={() => removeCoin(coin)} />
                        </span>
                    ))}
                </div>
            </Row>
        </Row>
    )
}

export default BaseCoinAuthorized
