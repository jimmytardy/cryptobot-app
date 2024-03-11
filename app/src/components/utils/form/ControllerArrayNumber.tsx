import { Col, Row, Form } from 'react-bootstrap'
import {
    Controller,
    ControllerProps,
    FieldValues,
    Path,
    PathValue,
    useFormContext,
} from 'react-hook-form'
import { isNumber } from '../../../utils'
import { Plus, X } from 'react-bootstrap-icons'
import './ControllerArrayNumber.scss'

interface IControllerArrayNumberProps<T extends FieldValues> {
    field: Path<T>
    label?: string
    rules?: ControllerProps<T>['rules']
    type?: 'string' | 'number'
    className?: string,
    max?: number
    disabled?: boolean
}

const ControllerArrayNumber = <T extends FieldValues>({
    field,
    label,
    rules,
    className,
    type = 'string',
    max = -1,
    disabled = false,
}: IControllerArrayNumberProps<T>) => {
    const { control, getValues, setValue } = useFormContext<T>()
    // Gérer les changements dans l'array'
    const handleArrayNumberChange = (
        field: Path<T>,
        index: number,
        value: string,
    ) => {
        const newValue = [
            ...(getValues(field) as (undefined | number | string)[]),
        ]
        if (isNumber(value.slice(-1))) {
            newValue[index] = type === 'string' ? Number(value || 0) : value
        } else {
            newValue[index] = value
        }
        setValue(field, newValue as PathValue<T, Path<T>>)
    }

    const addField = () => {
        const values = getValues(field) as (string | undefined)[]
        setValue(field, [...values, ''] as PathValue<T, Path<T>>)
    }

    const removeField = (index: number) => {
        const values = getValues(field) as (string | undefined)[]
        values.splice(index, 1)
        setValue(field, [...values] as PathValue<T, Path<T>>)
    }

    let validateProps = {}
    if (rules?.validate) {
        if (typeof rules.validate === 'function') {
            validateProps = { validate: rules.validate }
        } else {
            validateProps = rules.validate
        }
    }

    return (
        <Controller
            control={control}
            name={field}
            rules={{
                ...(rules || {}),
                validate: {
                    ...validateProps,
                    isNumber: (value: (string | number)[]) => {
                        for (const elem of value) {
                            if (!isNumber(elem))
                                return `La valeur ${elem} n'est pas un nombre`
                        }
                        return true
                    },
                },
            }}
            render={({ field: renderField }) => {
                const nbFields = (renderField.value as (number | undefined)[])
                    .length
                return (
                    <Row
                        className={
                            'pb-2 pt-2' + (className ? ' ' + className : '')
                        }
                    >
                        {(renderField.value as (number | undefined)[]).map(
                            (elem: number | undefined, index) => (
                                <Col key={field + '-' + index} xs={4} lg={2}>
                                    <Form.Label htmlFor={`${field}-${index}`}>
                                        {label || field.slice(0, -1)}{' '}
                                        {index + 1}
                                    </Form.Label>
                                    <div className="controller-array-number-input">
                                        <Form.Control
                                            type="text"
                                            disabled={disabled}
                                            value={elem}
                                            id={`${field}-${index}`}
                                            onKeyDown={(e) => {
                                                if (
                                                    Number.isNaN(
                                                        parseFloat(e.key),
                                                    )
                                                ) {
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
                                                            e.stopPropagation()
                                                            const values =
                                                                getValues(
                                                                    field,
                                                                ) as (
                                                                    | string
                                                                    | undefined
                                                                )[]
                                                            values[index] =
                                                                values[index] +
                                                                '.'
                                                            setValue(field, [
                                                                ...values,
                                                            ] as PathValue<
                                                                T,
                                                                Path<T>
                                                            >)
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
                                        {max >= 0 && index > 0 &&  (
                                            <span
                                            className="controller-array-number-input-icon controller-array-number-input-delete"
                                            onClick={() => removeField(index)}
                                        >
                                            <X />
                                        </span>
                                        )}
                                        
                                    </div>
                                </Col>
                            ),
                        )}
                        {max > nbFields && (
                            <Col xs={4} lg={2}>
                                <Form.Label htmlFor={`${field}-${nbFields}`}>
                                    {label || field.slice(0, -1)} {nbFields + 1}
                                </Form.Label>
                                <div className="controller-array-number-input">
                                    <Form.Control type="text" disabled />
                                    <span
                                        className="controller-array-number-input-icon controller-array-number-input-add"
                                        onClick={addField}
                                    >
                                        <Plus />
                                    </span>
                                </div>
                            </Col>
                        )}
                    </Row>
                )
            }}
        />
    )
}

export default ControllerArrayNumber
