import { Col, FormCheck, Row } from 'react-bootstrap'
import { Controller, Path, useFormContext } from 'react-hook-form'
import { IStrategyFormProps } from '.'
import { useState } from 'react';

const StrategyPEForm = <T extends object>({ name }: IStrategyFormProps<T>) => {
    const { watch, control } = useFormContext<T>();
    const [message, setMessage] = useState<string>('')
    const strategyPE: boolean[] = watch(`${name}.PE` as Path<T>)

    const PELabel = ['PE bas', 'PE haut'];

    const handleChange = (index: number, e: any, onChange: (e: any) => void) => {
        const PEs = [...strategyPE];
        PEs[index] = e.target.checked;
        if (PEs.find((pe) => pe)) {
            onChange(e);
            setMessage('');
        } else {
            setMessage('Au moins un PE doit être sélectionné');
        } 
    }

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
                                    onChange={(e) => handleChange(index, e, field.onChange)}
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
            <Col xs={12} className="mt-3">
                <p className="text-danger">{message}</p>
            </Col>
        </Row>
    )
}

export default StrategyPEForm
