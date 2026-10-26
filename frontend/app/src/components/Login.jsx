import { useState } from "react";

export default function Login({ onSwitch }){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(event) {
    event.preventDefault();

    console.log("Email:", email);
    console.log("Password submitted");

    setEmail("");
    setPassword("");

    //TODO connect to backend.
  }

  return (
    <div className="login-container">
      <h2>Log in to your account</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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



