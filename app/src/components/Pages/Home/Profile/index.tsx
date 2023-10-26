import { Button, Col, Container, FormText, Row } from 'react-bootstrap'
import { useAuth } from '../../../../hooks/AuthContext'
import './index.scss'
import { useEffect, useState } from 'react'
import axiosClient from '../../../../axiosClient'
import { ArrowClockwise } from 'react-bootstrap-icons'

interface BitgetProfile {
    available: number
    totalPnL: number
    unrealizedPL: number
}

const Profile = () => {
    const { user } = useAuth()
    const [bitGetProfile, setBitgetProfile] = useState<BitgetProfile>()
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const loadBitGetProfile = async () => {
        setIsLoading(true)
        const profile = await axiosClient.get('/bitget/profile')
        setBitgetProfile(profile.data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadBitGetProfile()
    }, [])

    return (
        <Container className="profile">
            <Row>
                <Col xs={12}>
                    <div className="form-title">
                        <b>Profil</b>
                    </div>
                </Col>
                <Col xs={12}>
                    <FormText>
                        Nom:{' '}
                        <b>
                            {user.firstname} {user.lastname}
                        </b>
                    </FormText>
                </Col>
                <Col xs={12}>
                    <FormText>
                        Email: <b>{user.email}</b>
                    </FormText>
                </Col>
            </Row>
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

export default Profile
