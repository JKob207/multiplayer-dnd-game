import { useState } from "react";

export default function Register({ onSwitch }) {
const [email, setEmail] = useState("");
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

function handleSubmit(e) {
e.preventDefault();

if (password !== confirmPassword) {
  alert("Passwords do not match.");
  return;
}

//TODO Connect registration backend 
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