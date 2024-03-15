import { useEffect, useState } from "react";
import { UserSubscriptionEnum } from "../../../../interfaces/user.interface";
import Loader from "../../../utils/Loader";
import axiosClient from "../../../../axiosClient";
import SubscriptionItem from "./SubscriptionItem";
import { Container } from "react-bootstrap";

export interface ISubscription {
    id: string;
    type: UserSubscriptionEnum;
    priceIds: string[]
}

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState<ISubscription[]>();

    useEffect(() => {
        (async () => {
            const { data } = await axiosClient.get('/subscription');
            setSubscriptions(data);
        })();
    }, []);

    if (!subscriptions) return <Loader />

    return (
        <Container className="subscription">
            <h2>Abonnements stripes</h2>
            {subscriptions.map(subscription => (
                <SubscriptionItem key={subscription.id} subscription={subscription} />
            ))}
        </Container>
    );
}

export default Subscriptions;