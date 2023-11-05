import { useEffect, useState } from 'react'
import axiosClient from '../../../../axiosClient'
import { Button, Col, Container, FormText, Row } from 'react-bootstrap'
import { ArrowClockwise } from 'react-bootstrap-icons'
import './index.scss';
interface IBitgetProfile {
    available: number
    totalPnL: number
    unrealizedPL: number
}

const BitgetProfile = () => {
    const [bitGetProfile, setBitgetProfile] = useState<IBitgetProfile>()
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const loadBitGetProfile = async () => {
        setIsLoading(true)
        try {
            const profile = await axiosClient.get('/bitget/profile?' + Date.now())
            setBitgetProfile(profile.data)
        } catch (e) {
            console.error(e);
        }
        
        setIsLoading(false)
    }

    useEffect(() => {
        loadBitGetProfile()
    }, [])

    return (
        <Container className='bitget-profile'>
            <Row>
                <Col xs={12}>
                    <div className="form-title">
                        <b>Solde</b>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={loadBitGetProfile}
                        >
                            <ArrowClockwise size={15} />
                        </Button>
                    </div>
                </Col>
                {isLoading || !bitGetProfile ? (
                    <div>Chargement du profil bitget en cours...</div>
                ) : (
                    <>
                        <Col xs={12}>
                            <FormText>
                                Total:{' '}
                                <b>{bitGetProfile.totalPnL.toFixed(2)} USDT</b>
                            </FormText>
                        </Col>
                        <Col xs={12}>
                            <FormText>
                                Disponible:{' '}
                                <b>{bitGetProfile.available.toFixed(2)} USDT</b>
                            </FormText>
                        </Col>
                        <Col xs={12}>
                            <FormText>
                                En cours:{' '}
                                <b>
                                    {bitGetProfile.unrealizedPL.toFixed(2)} USDT
                                </b>
                            </FormText>
                        </Col>
                    </>
                )}
            </Row>
        </Container>
    )
}

export default BitgetProfile;