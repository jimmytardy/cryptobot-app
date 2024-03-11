import { Col, Container, FormCheck, Row } from 'react-bootstrap'
import { IStrategyFormProps } from '.'
import { IOrderStrategyTP, TPSizeDefault, TPSizeType } from '../../interfaces/stategy.interface'
import { Controller, Path, PathValue, useFormContext } from 'react-hook-form'
import ControllerArrayNumber from '../utils/form/ControllerArrayNumber'
import { useState } from 'react'

const StrategyTPForm = <T extends object>({ name }: IStrategyFormProps<T>) => {
    const path = `${name}.TP` as Path<T>
    const [message, setMessage] = useState<string>('')
    const { setValue, watch, control } = useFormContext<T>()
    const strategyTP: IOrderStrategyTP = watch(path);

    const handleChangeNumAuthorized = (index: number, e: any, onChange: (e: any) => void) => {
        const numAuthorized = [...strategyTP.numAuthorized];
        numAuthorized[index] = e.target.checked;
        if (numAuthorized.find((num) => num)) {
            onChange(e);
            setMessage('');
        } else {
            setMessage('Au moins un TP doit être sélectionné');
        } 
    }

    return (
        <Container>
            <Row>
                <div className="form-sub-title">
                    <b>Séléction des TPs à utiliser</b>
                </div>
                {strategyTP.numAuthorized.map((_, index) => (
                    <Controller
                        key={`${path}.numAuthorized.${index}`}
                        name={`${path}.numAuthorized.${index}` as Path<T>}
                        control={control}
                        render={({ field }) => (
                            <Col xs={4} sm={2} className="mt-2 mb-2">
                                <FormCheck
                                    {...field}
                                    onChange={(e) => handleChangeNumAuthorized(index, e, field.onChange)}
                                    id={`${path}.numAuthorized.${index}`}
                                    key={`${path}.numAuthorized.${index}`}
                                    defaultChecked={strategyTP.numAuthorized[index]}
                                    checked={strategyTP.numAuthorized[index]}
                                    type="checkbox"
                                    label={`TP${index + 1}`}
                                />
                            </Col>
                        )}
                    />
                ))}
                <Col xs={12} className="mt-3">
                    <p className="text-danger">{message}</p>
                </Col>
            </Row>
            <Row>
                <div className="form-sub-title">
                    <b>Tailles des TPs à utiliser</b>
                </div>
                <Controller
                    control={control}
                    name={`${path}.TPSize` as Path<T>}
                    rules={{
                        validate: (value) => {
                            const values = Object.values(value)
                            let lineError = []
                            let index = 0
                            for (const value of values) {
                                if (!value && value !== 0) continue
                                index++
                                let total = 0
                                for (const key in value) {
                                    // @ts-ignore
                                    total += value[key] * 100 // si pas * 100, problème de virgules flottantes
                                }
                                if (total !== 100) {
                                    lineError.push(index)
                                }
                            }
                            if (lineError.length > 0) {
                                return 'La somme des lignes de TP suivantes doivent être égale à 1: ' + lineError.join(', ')
                            }
                            return true
                        },
                    }}
                    render={({ field }) => (
                        <>
                            {Object.keys(field.value).map((key: keyof TPSizeType) => {
                                const totalSize = (field.value as TPSizeType)[key].reduce((acc, value) => acc + value * 100, 0)
                                const disabled = strategyTP.numAuthorized.filter((v) => v).length < Number(key)
                                if (disabled && totalSize !== 100) {
                                    setValue(`${path}.TPSize.${key}` as Path<T>, TPSizeDefault[key] as PathValue<T, Path<T>>)
                                }
                                return (
                                    <ControllerArrayNumber
                                        key={'strategy-tp-' + key}
                                        type="number"
                                        rules={{
                                            max: 1,
                                            min: 0,
                                        }}
                                        className={'preferences-tp'}
                                        label="TP"
                                        disabled={disabled}
                                        field={`${path}.TPSize.${key}`}
                                    />
                                )
                            })}
                        </>
                    )}
                />
            </Row>
        </Container>
    )
}

export default StrategyTPForm
