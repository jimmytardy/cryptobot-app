import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import axiosClient from "../../../../axiosClient";
import { ISubAccount } from "../sub-account.interface";
import { useNavigate } from "react-router";
import { useAuth } from "../../../../hooks/AuthContext";
import { PersonFillDown } from "react-bootstrap-icons";
import './index.scss';

const SubAccountList = () => {
    const { setToken } = useAuth();
    const [subAccounts, setSubAccounts] = useState<ISubAccount[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const results = await axiosClient.get<ISubAccount[]>('/user/sub-accounts');
            setSubAccounts(results.data)
        })()
    }, []);

    const handleConnectIn = async (userId: string) => {
        try {
            const response = await axiosClient.post('/auth/sub-account/connect-in', { userId })
            setToken(response.data.access_token)
            navigate('/home', { replace: true })
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Container className="sub-account-list list">
            <h2>Sous-Comptes</h2>
            <Row>
                <Button style={{ width: 250 }} className="ms-auto mb-4" variant='success' onClick={() => navigate('/sub-accounts/new')}>
                    Ajouter un sous-compte
                </Button>
            </Row>
            <Row className="sub-account-list__header list-header">
                <Col style={{ width: 50 }} xs={'auto'}>#</Col>
                <Col xs={4} md={4} ld={3} className="text-truncate">Email</Col>
                <Col xs={3} md={3} lg={2}>Quantité</Col>
                <Col xs={4} md={4}>Stratégie</Col>
                <Col xs={'auto'} className="text-left"></Col>
            </Row>
            <Row className="list-body">
                <Col>
                    {subAccounts.map((subAccount: ISubAccount) => (
                        <Row key={subAccount._id} className="sub-account-list__item">
                            <Col style={{ width: 50 }} xs={'auto'}>#{subAccount.numAccount}</Col>
                            <Col xs={4} md={4} ld={3} title={subAccount.email} className="text-truncate">{subAccount.email}</Col>
                            <Col xs={3} md={3} lg={2}>{subAccount.preferences.bot.quantity || 0}</Col>
                            <Col xs={4} md={4}>{subAccount.preferences.bot.strategy?.name || 'Stratégie personnalisée'}</Col>
                            <Col xs={'auto'} className="text-left"><PersonFillDown title="Se connecter sur ce compte" onClick={() => handleConnectIn(subAccount._id)} /></Col>
                        </Row>
                    ))}
                </Col>
            </Row>
        </Container>
    )
}

export default SubAccountList;