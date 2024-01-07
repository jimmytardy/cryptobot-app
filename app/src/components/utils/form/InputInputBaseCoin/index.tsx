import { useEffect, useMemo, useState } from 'react'
import axiosClient from '../../../../axiosClient'
import { Controller, ControllerProps } from 'react-hook-form'
import Loader from '../../Loader'
import { FormSelect, FormSelectProps } from 'react-bootstrap'

interface IInputBaseCoinProps {
    onSelect: (coin: string) => void
    baseCoinExcluded?: string[]
}

const InputBaseCoin = <T extends object>({ onSelect, baseCoinExcluded }: IInputBaseCoinProps) => {
    const [baseCoins, setBaseCoins] = useState<string[]>([]) // Un état pour stocker les baseCoins
    const coins = useMemo(() => baseCoins.filter((coin) => !baseCoinExcluded || !baseCoinExcluded.includes(coin)), [baseCoins, baseCoinExcluded])

    useEffect(() => {
        ;(async () => {
            const result = await axiosClient.get('/bitget/baseCoins')
            setBaseCoins(result.data.sort())
        })()
    }, [])

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (baseCoins.includes(e.target.value)) {
            onSelect(e.target.value)
        }
    }

    if (baseCoins.length === 0) return <Loader />

    return (
        <FormSelect onChange={handleSelect}>
            <option selected>Choississez votre coin</option>
            {coins.map((coin: string) => (
                <option key={coin} value={coin} defaultValue={coin}>
                    {coin}
                </option>
            ))}
        </FormSelect>
    )
}

export default InputBaseCoin
