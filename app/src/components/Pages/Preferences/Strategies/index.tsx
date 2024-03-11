import { Col, FormCheck, Row } from 'react-bootstrap'
import { Path, PathValue, useFormContext } from 'react-hook-form'
import './index.scss'
import { useEffect, useState } from 'react'
import axiosClient from '../../../../axiosClient'
import { IStrategy, IUserStrategy, defaultStrategy } from '../../../../interfaces/stategy.interface'
import StrategyForm from '../../../StrategyForm'

interface IStrategieProps<T extends object> {
    name: Path<T>
}

const Strategies = <T extends object>({ name }: IStrategieProps<T>) => {
    const { setValue, watch } = useFormContext<T>()
    const strategyCurrent: IUserStrategy = watch(name)
    const [strategies, setStrategies] = useState<IStrategy[]>()

    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get('/strategy')
            setStrategies(response.data)
        })()
    }, [])

    const handleSelect = (strategy?: IStrategy) => {
        if (strategy) {
            const { _id, strategy: userStrategy } = strategy
            const newStrategy: IUserStrategy = {
                ...userStrategy,
                strategyId: _id,
            }
            setValue(name, newStrategy as PathValue<T, Path<T>>)
        } else {
            setValue(name, defaultStrategy.strategy as PathValue<T, Path<T>>)
        }
    }

    return (
        <Row className="strategy">
            <Row className="strategy-header strategy-line">
                <Col xs={'auto'} style={{ width: 50 }}></Col>
                <Col xs={8} md={3}>
                    <b>Nom</b>
                </Col>
                <Col className="d-none d-md-block" xs={5} md={5}>
                    Description
                </Col>
            </Row>
            {strategies?.map((strategy) => (
                <Row className="strategy-line" key={strategy._id}>
                    <Col xs={'auto'} style={{ width: 50 }} className="text-end">
                        <FormCheck type="radio" checked={strategy._id === strategyCurrent.strategyId} onClick={() => handleSelect(strategy)} />
                    </Col>
                    <Col xs={8} md={3}>
                        <b>{strategy.name}</b><i className='m-2'>{strategy.default && '(Par défaut)'}</i>
                    </Col>
                    <Col className="d-none d-md-block" md={8}>
                        {strategy.description}
                    </Col>
                </Row>
            ))}
            <Row className="strategy-line">
                <Col xs={'auto'} style={{ width: 50 }} className="text-end">
                    <FormCheck type="radio" checked={!strategyCurrent.strategyId} onClick={() => handleSelect(undefined)} />
                </Col>
                <Col xs={8} md={3}>
                    <b>Stratégie à personnaliser</b>
                </Col>
                <Col className="d-none d-md-block" md={8}>
                    Créez votre propre stratégie
                </Col>
                {!strategyCurrent.strategyId && (
                    <Col xs={12}>
                        <StrategyForm name={name} />
                    </Col>
                )}
            </Row>
        </Row>
    )
}

export default Strategies
