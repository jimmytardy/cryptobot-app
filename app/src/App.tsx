import { useState } from 'react';
import './App.scss';
import { Form, Button, Row, Col, Container } from 'react-bootstrap';

interface FormData {
  TPs: (number | undefined)[];
  PEs: (number | undefined)[];
  SL: number;
  baseCoin: string;
  side: string;
  size?: number;
  marginCoin: string;
}
const App = () => {
  const [formData, setFormData] = useState<FormData>({
    TPs: [undefined, undefined, undefined, undefined, undefined, undefined], // Un tableau pour stocker les TP
    PEs: [undefined, undefined], // Un tableau pour stocker les PE
    SL: 0,
    baseCoin: '',
    side: 'long',
    size: undefined,
    marginCoin: 'USDT',
  });
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false); // Un état pour désactiver le bouton d'envoi du formulaire

  // Gérer les changements dans les TP
  const handleTPChange = (index: number, value: number) => {
    const newTPs = [...formData.TPs];
    newTPs[index] = Number(value);
    setFormData({ ...formData, TPs: newTPs });
  };

  // Gérer les changements dans les PE
  const handlePEChange = (index: number, value: number) => {
    const newPEs = [...formData.PEs];
    newPEs[index] = Number(value);
    setFormData({ ...formData, PEs: newPEs });
  };

  const handleSLChange = (e: any) => {
    const SL = Number(e.target.value);
    setFormData({ ...formData, SL });
  };

  // Gérer les changements dans les autres champs
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitDisabled(true);
    const body = {
      ...formData,
      TPs: formData.TPs.filter((tp: number | undefined) => tp && tp > 0),
      PEs: formData.PEs.filter((pe: number | undefined) => pe && pe > 0),
    }
    if (body.TPs.length === 0 || body.PEs.length === 0) return;
    const result = await fetch(window.location.origin + '/api/bitget/placeOrder', {
      body: JSON.stringify(body),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
    console.log('result', result)
    setSubmitDisabled(false)
    // Envoyer les données au serveur ici
  };

  return (
    <Container>
      <h1>Formulaire</h1>
      <Form onSubmit={handleSubmit}>
        <Row className='mb-4'>
          {formData.PEs.map((pe, index) => (
            <Col xs={3}>
              <Form.Label htmlFor={'pe-' + index}>PE {index + 1}</Form.Label>
              <Form.Control
                key={index}
                id={'pe-' + index}
                value={pe}
                type='number'
                onChange={(e: any) => handlePEChange(index, e.target.value)}
              />
            </Col>
          ))}
        </Row>
        <Row className='mb-4'>
          {formData.TPs.map((tp, index) => (
            <Col>
              <Form.Label htmlFor={'tp-' + index}>TP {index + 1}</Form.Label>
              <Form.Control
                key={index}
                type='number'
                value={tp}
                id={'tp-' + index}
                onChange={(e: any) => handleTPChange(index, e.target.value)}
              />
            </Col>
          ))}
        </Row>
        <Row className='mb-4'>
          <Col xs={4}>
            <Form.Label htmlFor="SL">SL</Form.Label>
            <Form.Control
              id="SL"
              name="SL"
              type='number'
              defaultValue={formData.SL}
              onChange={handleSLChange}
              required
            />
          </Col>
        </Row>

        <Row className='mb-4'>
          <Col xs={4}>
            <Form.Label htmlFor='baseCoin'>Base Coin</Form.Label>
            <Form.Control
              id="baseCoin"
              name="baseCoin"
              value={formData.baseCoin}
              onChange={handleChange}
              required
            />
          </Col>
          <Col xs={4}>
            <Form.Label htmlFor="side">Side</Form.Label>
            <Form.Select
              id="side"
              name="side"
              value={formData.side}
              onChange={handleChange}
              required
            >
              <option value="long" >long</option>
              <option value="short" >short</option>
            </Form.Select>
          </Col>
        </Row>
        <Row className='mb-4'>
          <Col xs={12}>
            <h2>
              Valeurs optionnelles
            </h2>
          </Col>
          <Col xs={6}>
            <Form.Label htmlFor="size">Size (optionnel)</Form.Label>
            <Form.Control
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
            />
          </Col>
          <Col xs={6}>
            <Form.Label htmlFor="marginCoin">Margin Coin (optionnel)</Form.Label>
            <Form.Control
              id="marginCoin"
              name="marginCoin"
              value={formData.marginCoin}
              disabled={true}
            />
          </Col>
        </Row>
        <Col xs={3} className='m-auto'>
          <Button type="submit" disabled={submitDisabled}>
            Envoyer
          </Button>
        </Col>
      </Form >
    </Container>
  );
};

export default App;
