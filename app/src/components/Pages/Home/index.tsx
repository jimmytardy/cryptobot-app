import { Col, Container, Row } from "react-bootstrap";
import Profile from "./Profile";
import BitgetProfile from "./BitgetProfile";


const Home: React.FC = () => {
    return (
      <Container fluid={true}>
        <Row>
          <Col sm={12} md={3}>
            <Profile />
            <BitgetProfile />
          </Col>
          <Col sm={12} md={9}>
            {/* <PlaceOrder /> */}
          </Col>
        </Row>
      </Container>
    );
  };

  export default Home;