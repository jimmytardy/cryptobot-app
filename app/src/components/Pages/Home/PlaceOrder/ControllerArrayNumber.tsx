import { Col, Row, Form } from 'react-bootstrap'
import { Controller, Path, PathValue, useFormContext } from 'react-hook-form'

interface IControllerArrayNumberProps<T> {
    field: Path<T>
}

const ControllerArrayNumber = <T extends object>({
    field,
}: IControllerArrayNumberProps<T>) => {
    const { control, getValues, setValue } = useFormContext<T>()

    // Gérer les changements dans l'array'
    const handleArrayNumberChange = (
        field: Path<T>,
        index: number,
        value: string,
    ) => {
        if (isNaN(parseFloat(value))) return;
        const newValue = [...(getValues(field) as (undefined | string)[])]
        newValue[index] = value;
        setValue(field, newValue as PathValue<T, Path<T>>)
    }

    return (
        <Controller
            control={control}
            name={field}
            render={({ field: renderField }) => (
                <Row className="mb-4">
                    {(renderField.value as (number | undefined)[]).map(
                        (elem: number | undefined, index) => (
                            <Col key={'pe-' + index} xs={4} lg={2}>
                                <Form.Label htmlFor={'pe-' + index}>
                                    PE {index + 1}
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={elem}
                                    id={`${renderField}-${index}`}
                                    onKeyDown={(e) => {
                                        if (Number.isNaN(parseFloat(e.key))) {
                                            switch (e.key) {
                                                case 'Backspace':
                                                case 'Delete':
                                                case 'ArrowLeft':
                                                case 'ArrowRight':
                                                case 'Tab':
                                                case '.':
                                                    break
                                                case ',':
                                                    e.preventDefault() // Empêche la saisie de la virgule
                                                    e.stopPropagation();
                                                    const values = getValues(field) as (string | undefined)[];
                                                    values[index] = values[index] + '.';
                                                    setValue(field, [...values] as PathValue<T, Path<T>>);
                                                    break
                                                default:
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                            }
                                        }
                                    }}
                                    onChange={(e: any) =>
                                        handleArrayNumberChange(
                                            field,
                                            index,
                                            e.target.value,
                                        )
                                    }
                                />
                            </Col>
                        ),
                    )}
                </Row>
            )}
        />
    )
}

export default ControllerArrayNumber
