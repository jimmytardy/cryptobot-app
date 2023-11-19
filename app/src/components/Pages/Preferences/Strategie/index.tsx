import {
    Col,
    FormCheck,
    FormGroup,
    FormLabel,
    FormSelect,
    FormText,
    Row,
} from 'react-bootstrap'
import { useFormContext } from 'react-hook-form'
import { IPreferencePayload, IOrderStrategy, SLStepEnum } from '..'
import './index.scss'
import { useCallback } from 'react'

const Strategie = () => {
    const { setValue, watch } = useFormContext<IPreferencePayload>()
    const strategy = watch('order.strategy')

    const stepLabel: { [key in SLStepEnum]: string } = {
        [SLStepEnum.Default]: 'SL de base',
        [SLStepEnum.PE_BAS]: 'PE le plus bas',
        [SLStepEnum.PE_HAUT]: 'PE le plus haut',
        [SLStepEnum.TP1]: 'TP1',
        [SLStepEnum.TP2]: 'TP2',
        [SLStepEnum.TP3]: 'TP3',
        [SLStepEnum.TP4]: 'TP4',
    }
    const toogleStrategie = useCallback(() => {
        if (strategy) setValue('order.strategy', undefined)
        else
            setValue('order.strategy', {
                '0': SLStepEnum.PE_BAS,
                '1': SLStepEnum.PE_HAUT,
                '2': SLStepEnum.TP1,
                '3': SLStepEnum.TP2,
                '4': SLStepEnum.TP3,
            })
    }, [strategy])

    const onChangeStrategie = (key: keyof IOrderStrategy) => (value: number) => {
        if (strategy) {
            setValue('order.strategy', {
                ...strategy,
                [key]: value,
            })
        }
    }

    return (
        <Row className="strategy">
            <FormCheck
                type="switch"
                id="strategy"
                checked={!Boolean(strategy)}
                label={'Utiliser la stratégie par défault'}
                onChange={toogleStrategie}
            />
            <Col xs={12}>
                {!strategy ? (
                    <FormGroup>
                        <FormLabel>
                            <b>Stratégie par default: </b>
                        </FormLabel>
                        <div className="strategy-part">
                            <div className="strategy-action">
                                Lorsque TP1 est pris
                            </div>
                            <ol className="strategy-list">
                                <li>
                                    On supprime l'autre PE s'il n'a pas été pris
                                </li>
                                <li>
                                    On met le stop loss au PE le plus bas (PE de
                                    base s'il n'y en a qu'un seul)
                                </li>
                            </ol>
                        </div>
                        <div className="strategy-part">
                            <div className="strategy-action">
                                Lorsque TP2 est pris
                            </div>
                            <ol className="strategy-list">
                                <li>On met le stop loss au PE le plus haut</li>
                            </ol>
                        </div>
                        <div className="strategy-part">
                            <div className="strategy-action">
                                Lorsque que TP3 ou plus est pris
                            </div>
                            <ol className="strategy-list">
                                <li>On met le stop loss au TP pris -2</li>
                            </ol>
                        </div>
                    </FormGroup>
                ) : (
                    <FormGroup>
                        <FormLabel>
                            <b>Stratégie personnalisé: </b>
                        </FormLabel>
                        <div className="form-title">
                            Indiquez la valeur que prend la SL lorsque chaque TP
                            est pris
                        </div>
                        <FormText className='text-danger'>
                            Il est dangereux de faire une stratégie personnalisé si vous n'êtes pas familier avec les stratégies de trading
                        </FormText>
                        <Row>
                            {Object.keys(strategy).map((key: string) => {
                                const TPStep = Number(key.charAt(2))
                                let options: number[] = [
                                    SLStepEnum.Default,
                                    SLStepEnum.PE_BAS,
                                    SLStepEnum.PE_HAUT,
                                ]
                                if (TPStep > 1) options.push(SLStepEnum.TP1)
                                if (TPStep > 2) options.push(SLStepEnum.TP2)
                                if (TPStep > 3) options.push(SLStepEnum.TP3)
                                if (TPStep > 4) options.push(SLStepEnum.TP4)
                                return (
                                    <Col xs={6} md={4} className="mt-2 mb-2">
                                        <span className="form-title-sub">
                                            TP{Number(key) + 1}
                                        </span>
                                        <FormSelect
                                            defaultValue={
                                                strategy[
                                                    key as keyof IOrderStrategy
                                                ]
                                            }
                                            key={'strategy-' + key}
                                            aria-label={key}
                                            onChange={(e) =>
                                                onChangeStrategie(
                                                    key as keyof IOrderStrategy
                                                )(Number(e.target.value))
                                            }
                                        >
                                            {options.map((value) => (
                                                <option value={value}>
                                                    {
                                                        stepLabel[
                                                            value as SLStepEnum
                                                        ]
                                                    }
                                                </option>
                                            ))}
                                        </FormSelect>
                                    </Col>
                                )
                            })}
                        </Row>
                    </FormGroup>
                )}
            </Col>
        </Row>
    )
}

export default Strategie
