import { useEffect, useState } from 'react'
import { IOrderBot } from '../order-bot.interface'
import { useNavigate, useParams } from 'react-router'
import axiosClient from '../../../../../axiosClient'
import Loader from '../../../../utils/Loader'
import { FormProvider, useForm } from 'react-hook-form'
import { Col, Container, Row, Button, Modal } from 'react-bootstrap'
import { ArraySortEnum, checkSortArray, isObjectId } from '../../../../../utils'
import NotFound from '../../../../utils/NotFound'
import PlaceOrderForm from '../../../../PlaceOrderForm'

const OrderBotEdit = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [message, setMessage] = useState<string>()
    const [showModal, setShowModal] = useState<'resume' | 'delete' | 'close-position' | undefined>()
    const navigate = useNavigate()
    let { id } = useParams()
    const methods = useForm<IOrderBot>()
    const [lockedFields, setlockedFields] = useState<{ baseCoin: string; side: IOrderBot['side'] }>()

    useEffect(() => {
        if (!isObjectId(id)) return
        ;(async () => {
            const response = await axiosClient.get<IOrderBot>('/order-bot/' + id)
            if (!response) return navigate('/admin/order-bot')
            methods.reset(response.data)
            setlockedFields({
                baseCoin: response.data.baseCoin,
                side: response.data.side,
            })
            setIsLoading(false)
        })()
    }, [])

    if (isObjectId(id) === false) return <NotFound />

    if (isLoading && !lockedFields) return <Loader />

    const handleOrderBotSave = async (data: IOrderBot) => {
        let modeSort = lockedFields?.side === 'long' ? ArraySortEnum.ASC : ArraySortEnum.DESC
        if (
            (lockedFields?.side === 'long' && Math.max(...(data.PEs as number[])) > Math.min(...(data.TPs as number[]))) ||
            (lockedFields?.side === 'short' && Math.min(...(data.PEs as number[])) < Math.max(...(data.TPs as number[])))
        ) {
            setMessage('Les PEs doivent être inférieurs aux TPs')
            return
        }

        if ((lockedFields?.side === 'long' && data.SL > Math.min(...(data.PEs as number[]))) || (lockedFields?.side === 'short' && data.SL < Math.max(...(data.PEs as number[])))) {
            setMessage('Le SL doit être inférieur aux PEs')
            return
        }

        if (data.SL < 0) {
            setMessage('Le SL doit être positif')
            return
        }

        if (data.PEs.length !== data.PEs.filter((tp) => tp).length) {
            setMessage('Chaque PE ouvert doit être définis')
            return
        }
        if (data.TPs.length !== data.TPs.filter((tp) => tp).length) {
            setMessage('Chaque TP ouvert doit être définis')
            return
        }
        if (checkSortArray(data.PEs as number[]) !== modeSort) {
            setMessage('Les PEs doivent être triés par ordre ' + modeSort)
            return
        }

        if (checkSortArray(data.TPs as number[]) !== modeSort) {
            setMessage('Les TPs doivent être triés par ordre ' + modeSort)
            return
        }

        try {
            const formData = {
                SL: data.SL,
                TPs: data.TPs,
                PEs: data.PEs,
            }
            const result = await axiosClient.post<{ message: string }>('/order-bot/' + id, formData)
            methods.reset(formData)
            setMessage(result.data.message)
        } catch (error: any) {
            setMessage(error.response.data.message)
        }
    }

    const handleOpenModalDelete = () => setShowModal('delete')
    const handleOpenModalResume = () => setShowModal('resume')
    const handleOpenModalForceClosePosition = () => setShowModal('close-position')
    const handleCloseModal = () => setShowModal(undefined)

    const handleActionModal = async (action: 'delete' | 'resume' | 'close-position') => {
        try {
            if (action === 'delete') {
                await axiosClient.delete('/order-bot/' + id)
                setMessage('Tout les ordres de bot en cours ont bien été supprimé')
            } else if (action === 'resume') {
                await axiosClient.put('/order-bot/' + id)
                setMessage('Ordre de bot repris')
            } else if (action === 'close-position') {
                await axiosClient.post('/order-bot/close-position/' + id)
                setMessage('Toutes les positions ont bien été fermées')
            }
        } catch (error: any) {
            setMessage(error.response.data.message)
        } finally {
            setShowModal(undefined)
        }
    }

    return (
        <Container>
            <h2>Edition d'un ordre de bot</h2>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(handleOrderBotSave)}>
                    <PlaceOrderForm
                        lockedFields={lockedFields}
                    />
                    <Row className="mb-4">
                        <Col xs={12} className="text-center">
                            {message && <p>{message}</p>}
                        </Col>
                        <Col xs={12} className="text-center m-auto">
                            <Button style={{ width: 150 }} type="submit">
                                Enregistrer
                            </Button>
                            <Button className="ms-5" style={{ width: 150 }} onClick={handleOpenModalResume}>
                                Reprendre
                            </Button>
                            <Button className="ms-5" variant="danger" style={{ width: 300 }} type="button" onClick={handleOpenModalDelete}>
                                Supprimer tous les ordres en cours
                            </Button>
                            <Button className="ms-5" variant="danger" style={{ width: 300 }} onClick={handleOpenModalForceClosePosition}>
                                Fermer toutes les positions
                            </Button>
                        </Col>
                    </Row>
                    <Modal show={Boolean(showModal)} onHide={handleCloseModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>{showModal == 'resume' ? 'Reprise' : 'Suppression'} d'un ordre de bot</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Êtes-vous sûr de vouloir {showModal == 'resume' ? 'reprendre' : 'supprimer'} cet ordre de bot ?</Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Annuler
                            </Button>
                            {showModal &&
                                (showModal === 'resume' ? (
                                    <Button variant="primary" onClick={() => handleActionModal(showModal)}>
                                        Reprendre
                                    </Button>
                                ) : showModal === 'delete' ? (
                                    <Button variant="danger" onClick={() => handleActionModal(showModal)}>
                                        Supprimer
                                    </Button>
                                ) : (
                                    <Button variant="danger" onClick={() => handleActionModal(showModal)}>
                                        Fermer toutes les positions
                                    </Button>
                                ))}
                        </Modal.Footer>
                    </Modal>
                </form>
            </FormProvider>
        </Container>
    )
}

export default OrderBotEdit
