import { Col, Container, FormCheck, Row } from 'react-bootstrap'
import { IStrategyFormProps } from '.'
import { IOrderStrategyTP, TPSizeType } from '../../interfaces/stategy.interface'
import { Controller, Path, PathValue, set, useFormContext } from 'react-hook-form'
import ControllerArrayNumber from '../utils/form/ControllerArrayNumber'
import { TPSizeDefault } from '../Pages/Admin/Strategies/StategieEdit'

const StrategyTPForm = <T extends object>({ name }: IStrategyFormProps<T>) => {
    const path = `${name}.TP` as Path<T>
    const { setValue, watch, control } = useFormContext<T>()
    const strategyTP: IOrderStrategyTP = watch(path)
    return (
        <Container>
            <h3>Gestion des TPs</h3>
            <Row>
                <h4>Séléction des TPs utilisés</h4>
                {strategyTP.numAutorized.map((_, index) => (
                    <Controller
                        key={`${path}.numAutorized.${index}`}
                        name={`${path}.numAutorized.${index}` as Path<T>}
                        control={control}
                        render={({ field }) => (
                            <Col xs={4} sm={2} className="mt-2 mb-2">
                                <FormCheck
                                    {...field}
                                    id={`${path}.numAutorized.${index}`}
                                    key={`${path}.numAutorized.${index}`}
                                    defaultChecked={strategyTP.numAutorized[index]}
                                    checked={strategyTP.numAutorized[index]}
                                    type="checkbox"
                                    label={`TP${index + 1}`}
                                />
                            </Col>
                        )}
                    />
                ))}
            </Row>
            <Row>
                <h4>Tailles des TPs utilisés</h4>
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
                                const totalSize = ((field.value as TPSizeType)[key]).reduce((acc, value) => acc + (value * 100), 0);
                                const disabled = strategyTP.numAutorized.filter(v => v).length < Number(key);
                                console.log(key, strategyTP.numAutorized.length)
                                if (disabled && totalSize !== 100){
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
