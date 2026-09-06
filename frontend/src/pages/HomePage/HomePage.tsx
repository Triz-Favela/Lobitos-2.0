import "./HomePage.css"
import MainButton from "../../components/MainButton/MainButton.tsx"

function HomePage() {
  return (
  <div className="home-page">  
    <div className="background">
      <a>Info</a>
    </div>
    <div className="logo">
      <h1>LOBITOS</h1>
    </div>
    <div className="main-panel">
      <div className="main-panel-content">
        <MainButton onClick={() => (window.location.href = "/register")}>Cadastrar</MainButton>
        <div>
          <MainButton onClick={() => (window.location.href = "/login")}>Login</MainButton>
          <p>ou<br/><a href="/">Jogar como convidado</a></p>
        </div>
      </div>
      
    </div>
    
  </div>)
}

export default HomePage