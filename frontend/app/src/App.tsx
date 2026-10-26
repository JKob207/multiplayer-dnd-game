import { useState } from 'react'
import './App.css'
import Background from './components/Background.js'
import Register from './components/Register.js'
import Login from './components/Login.js'

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function handleRegistrationSuccess() {
    setShowRegister(false);
    setSuccessMessage("Registered successfully!");

    // Hide the popup after 3 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  }

  return (
    <>
      
      <div className="app">
      <Background />

       <main className="page-content">
    {showRegister ? (
      <Register
      onSwitch={() => setShowRegister(false)}
      onSuccess={handleRegistrationSuccess} />
    ) : (
      <Login onSwitch={() => setShowRegister(true)} />
    )}
  </main>

  {successMessage && (
        <div className="success-popup" role="status">
          {successMessage}
        </div>
      )}
    </div>
      
    </>
  )
}

export default App
