import { useEffect, useState } from "react";
import { Button, Col, Container, FormCheck, FormLabel, Modal, Row } from "react-bootstrap";
import axiosClient from "../../../../axiosClient";
import { ISubAccount } from "../sub-account.interface";
import { useNavigate } from "react-router";
import { useAuth } from "../../../../hooks/AuthContext";
import { ArrowClockwise, PersonFillDown, X } from "react-bootstrap-icons";
import './index.scss';

const SubAccountList = () => {
    const { setToken } = useAuth();
    const [subAccounts, setSubAccounts] = useState<ISubAccount[]>([]);
    const [modalDeleteSubAccount, setModalDeleteSubAccount] = useState<ISubAccount | null>(null);
    const [modalActivateSubAccount, setModalActivateSubAccount] = useState<ISubAccount | null>(null);
    const [deletePositionInProgress, setDeletePositionInProgress] = useState<boolean>(true);
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

    const handleModalDelete = (subAccount: ISubAccount) => {
        setModalDeleteSubAccount(subAccount)
        setDeletePositionInProgress(true);
    }

    const handleModalActivate = (subAccount: ISubAccount) => {
        setModalActivateSubAccount(subAccount)
    }

    const handleDeleteSubAccountWorker = async () => {
        if (modalDeleteSubAccount) {
            await axiosClient.delete(`/user/sub-account/${modalDeleteSubAccount._id}?deletePositionInProgress=${deletePositionInProgress}`);
            const newSubAccount = [...subAccounts];
            const index = newSubAccount.findIndex(subAccount => subAccount._id === modalDeleteSubAccount._id);
            newSubAccount[index].active = false;
            setSubAccounts(newSubAccount);
            setModalDeleteSubAccount(null);
            setDeletePositionInProgress(true);
        }
    }

    const handleActivateSubAccountWorker = async () => {
        if (modalActivateSubAccount) {
            await axiosClient.patch(`/user/sub-account/${modalActivateSubAccount._id}`);
            const newSubAccount = [...subAccounts];
            const index = newSubAccount.findIndex(subAccount => subAccount._id === modalActivateSubAccount._id);
            newSubAccount[index].active = true;
            setSubAccounts(newSubAccount);
            setModalActivateSubAccount(null);
        }
    }

    return (
        <Container className="sub-account-list list">
            <Row className="mt-5">
                {subAccounts.length > 5 ? (
                    <Col xs={12} className="mb-4">
                        <FormLabel className="form-title">Le nombre maximum de sous-compte a été atteint (5)</FormLabel>
                    </Col>
                ) : (
                    <Button style={{ width: 250 }} className="ms-auto mb-4" variant='success' onClick={() => navigate('/sub-accounts/new')}>
                        Ajouter un sous-compte
                    </Button>
                )}

            </Row>
            {subAccounts.filter(s => s.active).length > 0 && (
                <>
                    <h2>Sous-comptes <b>actifs</b></h2>
                    <Row className="sub-account-list__header list-header">
                        <Col style={{ width: 50 }} xs={'auto'}>#</Col>
                        <Col xs={4} md={4} ld={3} className="text-truncate">Email</Col>
                        <Col xs={3} md={3} lg={2}>Quantité</Col>
                        <Col xs={4} md={4}>Stratégie</Col>
                        <Col xs={'auto'} className="text-left"></Col>
                    </Row>
                    <Row className="list-body">
                        <Col>
                            {subAccounts.filter(s => s.active).map((subAccount: ISubAccount) => (
                                <Row key={subAccount._id} className="sub-account-list__item">
                                    <Col style={{ width: 50 }} xs={'auto'}>#{subAccount.numAccount}</Col>
                                    <Col xs={4} md={4} ld={3} title={subAccount.email} className="text-truncate">{subAccount.email}</Col>
                                    <Col xs={3} md={3} lg={2}>{subAccount.preferences.bot.quantity || 0}</Col>
                                    <Col xs={4} md={4}>{subAccount.preferences.bot.strategy?.name || 'Stratégie personnalisée'}</Col>
                                    <Col xs={'auto'} className="text-left">
                                        <PersonFillDown title="Se connecter sur ce compte" onClick={() => handleConnectIn(subAccount._id)} />
                                        <X title="Supprimer ce compte" onClick={() => handleModalDelete(subAccount)} />
                                    </Col>
                                </Row>
                            ))}
                        </Col>
                    </Row>
                </>
            )}

            {subAccounts.filter(s => !s.active).length > 0 && (
                <>
                    <h2 className="mt-5">Sous-comptes <b>inactifs</b></h2>
                    <Row className="sub-account-list__header list-header">
                        <Col style={{ width: 50 }} xs={'auto'}>#</Col>
                        <Col xs={4} md={4} ld={3} className="text-truncate">Email</Col>
                        <Col xs={3} md={3} lg={2}>Quantité</Col>
                        <Col xs={4} md={4}>Stratégie</Col>
                        <Col xs={'auto'} className="text-left"></Col>
                    </Row>
                    <Row className="list-body">
                        <Col>
                            {subAccounts.filter(s => !s.active).map((subAccount: ISubAccount) => (
                                <Row key={subAccount._id} className="sub-account-list__item">
                                    <Col style={{ width: 50 }} xs={'auto'}>#{subAccount.numAccount}</Col>
                                    <Col xs={4} md={4} ld={3} title={subAccount.email} className="text-truncate">{subAccount.email}</Col>
                                    <Col xs={3} md={3} lg={2}>{subAccount.preferences.bot.quantity || 0}</Col>
                                    <Col xs={4} md={4}>{subAccount.preferences.bot.strategy?.name || 'Stratégie personnalisée'}</Col>
                                    <Col xs={'auto'} className="text-left">
                                        <ArrowClockwise title="Réactiver ce compte" onClick={() => handleModalActivate(subAccount)} />
                                    </Col>
                                </Row>
                            ))}
                        </Col>
                    </Row>
                </>
            )}
            <Modal show={Boolean(modalDeleteSubAccount)} onHide={() => setModalDeleteSubAccount(null)}>
                <Modal.Header>
                    <Modal.Title>Supprimer le compte n°{modalDeleteSubAccount?.numAccount}: {modalDeleteSubAccount?.email}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Êtes-vous sûr de vouloir supprimer ce sous-compte ?</p>
                    <FormCheck type="checkbox" label="Supprimer les positions en cours" checked={deletePositionInProgress} onChange={() => setDeletePositionInProgress(!deletePositionInProgress)} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setModalDeleteSubAccount(null)}>Annuler</Button>
                    <Button variant="danger" onClick={handleDeleteSubAccountWorker} >Supprimer</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={Boolean(modalActivateSubAccount)} onHide={() => setModalActivateSubAccount(null)}>
                <Modal.Header>
                    <Modal.Title>Activer le compte n°{modalDeleteSubAccount?.numAccount}: {modalDeleteSubAccount?.email}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Êtes-vous sûr de vouloir re-activer ce sous-compte ?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setModalActivateSubAccount(null)}>Annuler</Button>
                    <Button variant="success" onClick={handleActivateSubAccountWorker} >Activer</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    )
}

export default SubAccountList;