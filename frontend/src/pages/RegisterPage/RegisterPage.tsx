import "./RegisterPage.css"
import GoBackBtn from "../../components/GoBackBtn"

export const RegisterPage = () => {

    const SubmitHandler = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch("http://localhost:3000/user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: (document.getElementById("username") as HTMLInputElement).value,
                email: (document.getElementById("email") as HTMLInputElement).value,
                password: (document.getElementById("password") as HTMLInputElement).value
            })
        });

        if (response.ok) {
            window.location.href = "/";
        }else{
            alert(`Erro ao cadastrar usuário: ${response.statusText}`);
        }
    }

  return (
    <div className="register-page">
        <GoBackBtn to="/"/>
        <form className="register-form" onSubmit={SubmitHandler}>
            <h1>Cadastro</h1>
            <label htmlFor="username">Nome de usuário</label>
            <input type="text" id="username" placeholder="Ex: Jessica" />
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Ex: jessica@example.com" />
            <label htmlFor="password">Senha</label>
            <input type="password" id="password" placeholder="Ex: 123456" />
            <button type="submit">Cadastrar</button>
        </form>
        
    </div>
  )
}

export default RegisterPage