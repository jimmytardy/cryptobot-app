import { Controller, Path, PathValue, useFormContext } from 'react-hook-form'
import { IStrategyFormProps } from '.'
import { IOrderStrategySL, IOrderStrategyTP, SLStepEnum } from '../../interfaces/stategy.interface'
import { Col, FormCheck, Row } from 'react-bootstrap'

const StrategySLForm = <T extends object>({ name }: IStrategyFormProps<T>) => {
    const { setValue, watch, control } = useFormContext<T>()
    const strategySL: IOrderStrategySL = watch(`${name}.SL` as Path<T>)
    const strategyTPAuthorized: IOrderStrategyTP['numAuthorized'] = watch(`${name}.TP.numAuthorized` as Path<T>)

    const stepLabel: { [key in SLStepEnum]: string } = {
        [SLStepEnum.Default]: 'SL de base',
        [SLStepEnum.PE_BAS]: 'PE le plus bas',
        [SLStepEnum.PE_HAUT]: 'PE le plus haut',
        [SLStepEnum.TP1]: 'TP1',
        [SLStepEnum.TP2]: 'TP2',
        [SLStepEnum.TP3]: 'TP3',
        [SLStepEnum.TP4]: 'TP4',
    }

    function isLastAuthorized(nums: boolean[], index: number) {
        // Vérifie si l'index est valide 
        // Vérifie si l'élément à l'index est bien `true`
        if (index < 0 || index >= nums.length || !nums[index]) {
          return false; // Index invalide
        }
        // Parcourt les éléments suivants pour voir si un autre `true` est présent
        for (let i = index + 1; i < nums.length; i++) {
          if (nums[i]) {
            return false; // Trouvé un autre `true` après l'index, donc pas le dernier
          }
        }
        // Aucun `true` trouvé après l'index, c'est donc le dernier `true`
        return true;
      }

    return (
        <Row>
            <div className="form-sub-title">
                <b>Changement de prix de la SL lors de déclenchement de chaque TP</b>
            </div>
            {(Object.keys(strategySL) as (keyof IOrderStrategySL)[]).map((key) => {
                const path = `${name}.SL.${key}` as Path<T>

                const minStep = key === '0' ? SLStepEnum.Default : strategySL[String(Number(key) - 1) as keyof IOrderStrategySL]
                if (strategySL[key] !== minStep && (!strategyTPAuthorized[key] || minStep > strategySL[key])) {
                    setValue(path, minStep as PathValue<T, Path<T>>)
                }

                const TPStep = Number(key)
                let options: number[] = [SLStepEnum.Default, SLStepEnum.PE_BAS, SLStepEnum.PE_HAUT]
                if (TPStep > 0) options.push(SLStepEnum.TP1)
                if (TPStep > 1) options.push(SLStepEnum.TP2)
                if (TPStep > 2) options.push(SLStepEnum.TP3)
                if (TPStep > 3) options.push(SLStepEnum.TP4)
                return (
                    strategyTPAuthorized[key] && !isLastAuthorized(strategyTPAuthorized, Number(key)) && (
                        <Controller
                            name={path}
                            control={control}
                            render={({ field }) => (
                                <Col xs={12} md={6} lg={4} className="mt-2 mb-2">
                                    <span className="form-title-sub">Déclenchement TP{Number(key) + 1}</span>
                                    {options.map((value) => (
                                        <FormCheck
                                            id={`${path}.${value}`}
                                            key={`${path}.${value}`}
                                            {...field}
                                            defaultChecked={strategySL[key] == value}
                                            checked={strategySL[key] == value}
                                            disabled={minStep > value}
                                            value={value}
                                            type="radio"
                                            label={stepLabel[value as SLStepEnum]}
                                        />
                                    ))}
                                </Col>
                            )}
                        />
                    )
                )
            })}
        </Row>
    )
}

export default StrategySLForm
