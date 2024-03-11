import { Col, FormCheck, Row } from 'react-bootstrap'
import { Controller, Path, useFormContext } from 'react-hook-form'
import { IStrategyFormProps } from '.'

const StrategyPEForm = <T extends object>({ name }: IStrategyFormProps<T>) => {
    const { watch, control } = useFormContext<T>()
    const strategyPE: boolean[] = watch(`${name}.PE` as Path<T>)

    const PELabel = ['PE haut', 'PE bas'];

    return (
        <Row>
            <div className='form-sub-title'><b>Séléction des PE à utiliser</b></div>
            {strategyPE.map((_, index) => {
                const path = `${name}.PE.${index}` as Path<T>
                return (
                    <Controller
                        key={path}
                        name={path}
                        control={control}
                        render={({ field }) => (
                            <Col xs={12} md={6} lg={2} className="mt-2 mb-2">
                                <FormCheck
                                    {...field}
                                    id={path}
                                    key={path}
                                    defaultChecked={strategyPE[index]}
                                    checked={strategyPE[index]}
                                    type="checkbox"
                                    label={PELabel[index]}
                                />
                            </Col>
                        )}
                    />
                )
            })}
        </Row>
    )
}

export default StrategyPEForm
