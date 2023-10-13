import { Container, Row } from 'react-bootstrap'

export default function NotFound() {
    return (
        <Container>
            <Row className="text-center">
                <h1>Oops !</h1>
                <p>Cette page n'existe pas</p>
            </Row>
        </Container>
    )
}
