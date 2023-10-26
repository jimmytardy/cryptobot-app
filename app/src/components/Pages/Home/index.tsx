import { Col, Container, Row } from "react-bootstrap";
import PlaceOrder from "./PlaceOrder";
import Profile from "./Profile";
import Positions from "./Positions";


const Home: React.FC = () => {
    return (
      <Container fluid={true}>
        <Row>
          <Col sm={12} md={4}>
            <Profile />
          </Col>
          <Col sm={12} md={8}>
            <PlaceOrder />
          </Col>
          <Col>
            <Positions />
          </Col>
        </Row>
      </Container>
    );
  };

  export default Home;