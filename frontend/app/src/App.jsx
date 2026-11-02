import { useState } from 'react'
import './App.css'
import Background from './components/Background'
import Register from './components/Register'
import Login from './components/Login'

function App() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      
      <div className="app">
      <Background />

       <main className="page-content">
    {showRegister ? (
      <Register onSwitch={() => setShowRegister(false)} />
    ) : (
      <Login onSwitch={() => setShowRegister(true)} />
    )}
  </main>
    </div>
      
    </>
  )
}

export default App
