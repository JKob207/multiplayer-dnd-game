import { useState } from 'react'
import './App.css'
import Background from './components/Background.js'
import Register from './components/Register.js'
import Login from './components/Login.js'
import Lobby from './components/Lobby';
import { socket } from '../socket';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
   const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('accessToken'))
  );

  function handleRegistrationSuccess() {
    setShowRegister(false);
    setSuccessMessage("Registered successfully!");

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  }
   function handleLogout() {
    localStorage.removeItem('accessToken');
    socket.disconnect();
    setIsAuthenticated(false);
    setShowRegister(false);
  }

  return (
    <>
      
      <div className="app">
      <Background />

        <main className="page-content">
        {isAuthenticated ? (
          <Lobby onLogout={handleLogout} />
        ) : showRegister ? (
          <Register
            onSwitch={() => setShowRegister(false)}
            onSuccess={handleRegistrationSuccess}
          />
        ) : (
          <Login
            onSwitch={() => setShowRegister(true)}
            onSuccess={() => setIsAuthenticated(true)}
          />
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
