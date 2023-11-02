import { Col, Container, Row } from "react-bootstrap";
import PlaceOrder from "./PlaceOrder";
import Profile from "./Profile";


const Home: React.FC = () => {
    return (
      <Container fluid={true}>
        <Row>
          <Col sm={12} md={3}>
            <Profile />
          </Col>
          <Col sm={12} md={9}>
            {/* <PlaceOrder /> */}
          </Col>
        </Row>
      </Container>
    );
  };

  export default Home;