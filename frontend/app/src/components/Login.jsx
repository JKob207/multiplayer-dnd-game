import { useState } from "react";
import { socket } from "../../socket";

export default function Login({ onSwitch }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("")
    console.log("Login:", login);
    console.log("Password submitted");

    fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
    })
      .then(async res => {
        if (res.ok) {
          return res.json();
        }
        const data = await res.json();
        setError(data.message);

        throw new Error('connection error.')
      })
      .then(data => {
        console.log(data.message);
        localStorage.setItem("accessToken", JSON.stringify(data.token));
        socket.auth.token = data.token;
        socket.connect();
      })
      .catch(e => console.error(e));

    setLogin("");
    setPassword("");
  }

  return (
    <div className="login-container">
      <h2>Log in to your account</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login">Login</label>
          <input
            id="login"
            type="text"
            placeholder="Enter your name or email"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <div className="form-group">
            <p style={{ color: "red" }}>{error}</p>
          </div>
        )}
        <button type="submit">Log In</button>
      </form>

      <p>
        Don't have an account?{" "}
        <button className="switch-button" type="button" onClick={onSwitch}>
          Register
        </button>
      </p>
    </div>
  );
}



