import { Col, Row } from 'react-bootstrap'
import './index.scss'
import { ReactNode } from 'react'

interface ITutorialStepProps {
    description?: ReactNode
    image?: string
    title?: string
    step: string
}

const TutorialStep = ({ description, image, title, step }: ITutorialStepProps) => {
    return (
        <Row className="tutorial-step-item" id={step}>
            <Col>
                {title && <h4 className="tutorial-step__title">{step} - {title}</h4>}
                <p className="tutorial-step__description">{description}</p>
                {image && (
                    <div className="tutorial-step__image">
                        <img src={image} alt={title} />
                    </div>
                )}
            </Col>
        </Row>
    )
}

export default TutorialStep
