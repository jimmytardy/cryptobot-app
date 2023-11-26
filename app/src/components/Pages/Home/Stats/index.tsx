import { useEffect, useState } from "react";
import { Col, Container, FormControl, FormLabel, Row } from "react-bootstrap"
import { IStats } from "./stat.interface";
import axiosClient from "../../../../axiosClient";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Loader from "../../../utils/Loader";
import './index.scss';
import { useForm, useFormState } from "react-hook-form";
import { useAuth } from "../../../../hooks/AuthContext";
import { getFormatDateForInput } from "../../../../utils";

ChartJS.register(ArcElement, Tooltip, Legend);

interface IStatsPayload {
  startDate: string,
  endDate: string,
}

const Stats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<IStats>();
  const colors = {
    'red': ['#ffc100', '#ff9a00', '	#ff7400', '#ff4d00', '	#ff0000', '#b30000'],
    'green': ['#0eff00', '#0de600', '#1fc600', '#089000', '#0a5d00', '#063b00']
  }
  const methods = useForm<IStatsPayload>({
    defaultValues: {
      startDate: getFormatDateForInput(new Date(user.createdAt)),
      endDate: getFormatDateForInput(new Date())
    },
  });
  const formState = useFormState({ control: methods.control });

  const { endDate, startDate } = methods.watch();

  useEffect(() => {
    (async () => {
      const result = await axiosClient.get<IStats>('/user/stats', { params: {
        startDate, endDate
      }});
      setStats(result.data);
    })();
  }, [endDate, startDate]);

  if (!stats) return <Loader />

  const handleValidateChangeDate = (data: IStatsPayload) => {

  }

  const rules = {
    startDate: {
      max: getFormatDateForInput(new Date(endDate))
    },
    endDate: {
      min: getFormatDateForInput(new Date(startDate)),
    }
  }

  return (
    <Container className="stats">
      <h2>Stats</h2>
      <form onSubmit={methods.handleSubmit(handleValidateChangeDate)}>
        <Row>
          <Col xs={12}>
            <div className="form-title">
              Dates
            </div>
          </Col>
          <Col xs={6}>
            <FormLabel>Date de début</FormLabel>
            <FormControl {...methods.register('startDate', rules.startDate)} type="date" {...rules.startDate} />
            {formState.errors?.startDate && (
              <p
                className="text-danger"
                style={{ fontSize: 14 }}
              >
                La date de début doit être inférieur ou égal à la date de fin
              </p>
            )}
          </Col>
          <Col xs={6}>
            <FormLabel>Date de fin</FormLabel>
            <FormControl {...methods.register('endDate', rules.endDate)} type="date" {...rules.endDate} />
            {formState.errors?.endDate && (
              <p
                className="text-danger"
                style={{ fontSize: 14 }}
              >
                La date de fin doit être supérieur ou égal à la date de début
              </p>
            )}
          </Col>
        </Row>
      </form>

      <Row>
        <div className="section-title">Etats des ordres</div>
        <Col xs={6} md={4} className="m-auto">
          <Pie data={{
            labels: ['Terminés', 'En cours', 'En attente d\'envoi'],
            datasets: [
              {
                data: [stats.nbTerminated, stats.nbInProgress, stats.nbWaitToSendPlateform],
                backgroundColor: [colors.green[2], colors.red[2], 'black'],
              },
            ],
          }} />
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <div className="section-title">
            Détails des TP/SL
          </div>
        </Col>
        <Col xs={6} md={4} className="m-auto">
          <div className="col-body">
            <div className="form-title">Nombre de TP/SL au prix bas</div>
            <Pie data={{
              labels: ['TP', 'SL'],
              datasets: [
                {
                  data: [stats.nbTotalTP, stats.nbSL[-1]],
                  backgroundColor: [
                    colors.red[0],
                    colors.red[5]
                  ],
                },
              ],
            }} />
          </div>
        </Col>
        <Col xs={6} md={4} className="m-auto">
          <div className="col-body">
            <div className="form-title">Détails des TP pris</div>
            <Pie data={{
              labels: ['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6'],
              datasets: [
                {
                  data: stats.nbTP,
                  backgroundColor: colors.green,
                },
              ],
            }} />
          </div>
        </Col>
        <Col xs={6} md={4} className="m-auto">
          <div className="col-body">
            <div className="form-title">Détails des SL pris</div>
            <Pie data={{
              labels: ['SL', 'PE Bas', 'PE Haut', 'TP1', 'TP2', 'TP3', 'TP4'],
              datasets: [
                {
                  data: stats.nbTP,
                  backgroundColor: colors.red.reverse(),
                },
              ],
            }} />
          </div>

        </Col>
      </Row>
    </Container>
  )
}

export default Stats;