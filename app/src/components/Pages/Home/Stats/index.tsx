import { useEffect, useState } from 'react'
import { Col, Container, FormControl, FormLabel, Row } from 'react-bootstrap'
import { IStats } from './stat.interface'
import axiosClient from '../../../../axiosClient'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import Loader from '../../../utils/Loader'
import './index.scss'
import { getFormatDateForInput } from '../../../../utils'
import StatsPositions from './StatsPositions'

ChartJS.register(ArcElement, Tooltip, Legend)

interface IStatsPayload {
    dateFrom?: string
    dateTo?: string
}

const Stats = () => {
    const [stats, setStats] = useState<IStats>()
    const colors = {
        red: ['#ffc100', '#ff9a00', '	#ff7400', '#ff4d00', '	#ff0000', '#b30000'],
        green: ['#0eff00', '#0de600', '#1fc600', '#089000', '#0a5d00', '#063b00'],
    }

    const [dates, setDates] = useState<IStatsPayload>({
        dateFrom: undefined,
        dateTo: undefined,
    })
    const [messageDate, setMessageDate] = useState<string>('')

    useEffect(() => {
        if (dates.dateFrom && dates.dateTo && new Date(dates.dateFrom) > new Date(dates.dateTo))
            return setMessageDate('La date de début doit être inférieur ou égal à la date de fin')
        else setMessageDate('')
        ;(async () => {
            const params: { dateTo?: string; dateFrom?: string } = {}
            if (dates.dateFrom) params['dateFrom'] = new Date(dates.dateFrom).toISOString()
            if (dates.dateTo) params.dateTo = new Date(dates.dateTo).toISOString()
            const result = await axiosClient.get<IStats>('/user/stats', { params: params })
            setStats(result.data)
        })()
    }, [dates])

    const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDates({ ...dates, [e.target.name]: e.target.value })
    }

    if (!stats) return <Loader />

    const rules = {
        dateFrom: {
            max: dates.dateTo && getFormatDateForInput(new Date(dates.dateTo)),
        },
        dateTo: {
            min: dates.dateFrom && getFormatDateForInput(new Date(dates.dateFrom)),
        },
    }

    return (
        <Container className="stats">
            <Row>
                <Col xs={12}>
                    <div className="section-title">Positions en cours</div>
                </Col>
                <Col xs={12}>
                    <StatsPositions positions={stats.positions} />
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="section-title">Dates de lancement des ordres</div>
                </Col>
                <Col xs={6}>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl type="date" onChange={handleChangeDate} defaultValue={dates.dateFrom} name="dateFrom" {...rules.dateFrom} />
                </Col>
                <Col xs={6}>
                    <FormLabel>Date de fin</FormLabel>
                    <FormControl type="date" onChange={handleChangeDate} defaultValue={dates.dateTo} name="dateTo" {...rules.dateTo} />
                </Col>
                <Col xs={12} className="mt-3">
                    <p className="text-danger">{messageDate}</p>
                </Col>
            </Row>
            <Row>
                <div className="section-title">Etats des ordres</div>
                <Col xs={6} md={4} lg={3} className="m-auto">
                    <Pie
                        data={{
                            labels: ['Terminés', 'En cours'],
                            datasets: [
                                {
                                    data: [stats.nbTerminated, stats.nbInProgress],
                                    backgroundColor: [colors.green[2], colors.red[2]],
                                },
                            ],
                        }}
                    />
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="section-title">Détails des TP/SL</div>
                </Col>
                <Col xs={6} md={4} lg={3} className="m-auto mt-3">
                    <div className="col-body">
                        <div className="form-title">Nombre de TP/SL</div>
                        <Pie
                            data={{
                                labels: ['TP', 'SL'],
                                datasets: [
                                    {
                                        data: [stats.nbTotalTP, stats.nbSL[-1]],
                                        backgroundColor: [colors.red[0], colors.red[5]],
                                    },
                                ],
                            }}
                        />
                    </div>
                </Col>
                <Col xs={6} md={4} lg={3} className="m-auto mt-3">
                    <div className="col-body">
                        <div className="form-title">Détails des TPs</div>
                        <Pie
                            data={{
                                labels: ['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6'],
                                datasets: [
                                    {
                                        data: stats.nbTP,
                                        backgroundColor: colors.green.reverse(),
                                    },
                                ],
                            }}
                        />
                    </div>
                </Col>
                <Col xs={6} md={4} lg={3} className="m-auto mt-3">
                    <div className="col-body">
                        <div className="form-title">Détails des SLs</div>
                        <Pie
                            data={{
                                labels: ['SL', 'PE Bas', 'PE Haut', 'TP1', 'TP2', 'TP3', 'TP4', 'TP5'],
                                datasets: [
                                    {
                                        data: [stats.nbSL[-1], stats.nbSL[0], stats.nbSL[1], stats.nbSL[2], stats.nbSL[3], stats.nbSL[4], stats.nbSL[5]],
                                        backgroundColor: colors.red.reverse().slice(0, 3).concat(colors.green.slice(0, 5)),
                                    },
                                ],
                            }}
                        />
                    </div>
                </Col>
            </Row>
        </Container>
    )
}

export default Stats
