import './index.scss'

const Loader = () => {
    return (
        <div className="loader">
            <div className="loader-outter"></div>
            <div className="loader-inner"></div>
            <img src="/icon.png" alt="Chargement en cours..."></img>
        </div>
    )
}

export default Loader
