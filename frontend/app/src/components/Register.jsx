import { useState } from "react";

export default function Register({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    fetch("http://localhost:3000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: username, email, password }),
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
        console.log(data.message)
        onSwitch(); //jakby sie dalo zwiekszyc predkosc hmur podczas tej funkcji, zeby bylo plynne przejscie pomiedzy formularzami to byloby super
      })
      .catch(e => console.error(e));

    console.log("Registration form submitted");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="login-container">
      <h2>Create your account</h2>
      <p>Register to get started</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <p className="register-password-hint">Use at least 8 characters, including a number,
            an uppercase letter and a special sign.</p>
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && (
          <div className="form-group">
            <p style={{ color: "red" }}>{error}</p>
          </div>
        )}
        <button type="submit">Register</button>
      </form>

      <p>
        Already have an account?{" "}
        <button className="switch-button" type="button" onClick={onSwitch}>
          Login
        </button>
      </p>
    </div>

  );
}