
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Background from './components/Background.js';
import Register from './components/Register.js';
import Login from './components/Login.js';
import Lobby from './components/Lobby';
import GameCanvas from './components/GameCanvas';
import { socket } from '../socket';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('accessToken'))
  );

  function handleRegistrationSuccess() {
    setShowRegister(false);
    setSuccessMessage('Registered successfully!');

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  }

  function handleLogout() {
    localStorage.removeItem('accessToken');
    socket.disconnect();
    setIsAuthenticated(false);
    setShowRegister(false);
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Background />

        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/lobby" replace />
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
                )
              }
            />

            <Route
              path="/lobby"
              element={
                isAuthenticated ? (
                  <Lobby onLogout={handleLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/game"
              element={
                isAuthenticated ? (
                  <GameCanvas />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {successMessage && (
          <div className="success-popup" role="status">
            {successMessage}
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
