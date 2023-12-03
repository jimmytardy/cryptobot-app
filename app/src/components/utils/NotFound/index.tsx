import { Button, Container, Row } from 'react-bootstrap'
import './index.scss';
import { useNavigate } from 'react-router';

export default function NotFound() {
    const navigate = useNavigate();

    const handleReturn = () => {
        navigate(-1);
    }

    return (
        <Container className='not-found'>
            <Row className="text-center">
                <h1>Oops !</h1>
                <p>Cette page n'existe pas</p>
                <Button onClick={handleReturn}>Retour en arrière</Button>
            </Row>
        </Container>
    )
}
