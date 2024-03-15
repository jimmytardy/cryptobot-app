import { Controller, useFieldArray, useForm } from "react-hook-form";
import { ISubscription } from "..";
import { Button, Col, FormControl, Row } from "react-bootstrap";
import axiosClient from "../../../../../axiosClient";
import { useState } from "react";

interface SubscriptionItemProps {
    subscription: ISubscription;
}

const SubscriptionItem = ({ subscription }: SubscriptionItemProps) => {
    const { control, handleSubmit, watch, setValue } = useForm<{ priceIds: ISubscription['priceIds'] }>({
        defaultValues: {
            priceIds: subscription.priceIds
        }
    });
    const [message, setMessage] = useState<string>();
    const priceIds = watch('priceIds');

    const append = (newPriceIds: string) => {
        setValue('priceIds', [...priceIds, newPriceIds]);
    }

    const remove = (index: number) => {
        const newPricesIds = [...priceIds];
        newPricesIds.splice(index, 1);
        setValue('priceIds', newPricesIds);
    }
    const submitData = async () => {
        try {
            await axiosClient.post(`/subscription/${subscription.id}`, { priceIds });
            setMessage('Enregistré avec succès');
        } catch (e) {
            console.error(e);
            setMessage('Erreur lors de l\'enregistrement');
        }
    }

    return (
        <form onSubmit={handleSubmit(submitData)}>
            <Row>
                <Col xs={12} className="form-title">Type de droits: {subscription.type.toUpperCase()}</Col>
                <Col xs={12} className="mt-3 mb-3">
                    <Button style={{ width: 100 }} type="button" onClick={() => append('')}>Ajouter</Button>
                </Col>
                {priceIds.map((priceId, index) => (
                    <Col xs={12} key={index} className="mt-3 mb-3">
                        <Controller name={`priceIds.${index}`} control={control} defaultValue={priceId} render={({ field }) => (
                            <FormControl {...field} />
                        )} />
                        <button style={{ width: 100 }} type="button" onClick={() => remove(index)}>Supprimer</button>
                    </Col>
                ))}
            </Row>
            <Col xs={12} className="mt-3 mb-3 d-flex">
                <Button style={{ width: 150 }} type="submit">Enregistrer</Button>
                {message && <span>{message}</span>}
            </Col>
        </form>
    );
}

export default SubscriptionItem;