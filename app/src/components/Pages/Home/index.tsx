import { Col, Container, Row } from "react-bootstrap";
import Profile from "./Profile";
import BitgetProfile from "./BitgetProfile";
import Stats from "./Stats";
import { useAuth } from "../../../hooks/AuthContext";
import SubAccountProfile from "./Stats/SubAccountsProfile";

const Home: React.FC = () => {
  const { user } = useAuth()
  return (
    <Container fluid={true}>
      <Row>
        <Col sm={12} md={3}>
          <Profile />
          {user.subscription?.name && <BitgetProfile />}
        </Col>
        <Col sm={12} md={9}>
          <Stats />
        </Col>
      </Row>
    </Container >
  );
};

export default Home;