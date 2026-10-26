
import { useState } from 'react';
import './Lobby.css';

type LobbyProps = {
  onLogout: () => void;
};

export default function Lobby({ onLogout }: LobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [message, setMessage] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  function handleJoin() {
  if (roomCode.length !== 6) {
    setMessage('Please enter a 6-character room code.');
    return;
  }

  setMessage(`Joining room ${roomCode} — coming soon!`);
}

  function handleCreate() {
    setMessage('Create Lobby — coming soon!');
  }

  return (
    <section className="lobby">
      <div className="lobby-menu">
        <h1>Welcome Player</h1>

        <div className="lobby-menu-actions">
          <button
            type="button"
            onClick={() => {
              setShowJoin(!showJoin);
              setMessage('');
            }}
          >
            Join Lobby
          </button>

          {showJoin && (
            <div className="join-form">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="6-character room code"
                aria-label="Room code"
                maxLength={6}
                value={roomCode}
                onChange={(event) => {
                  setRoomCode(
                    event.target.value
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .toUpperCase()
                    );
                  setMessage('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleJoin();
                }}
              />

              <button
                type="button"
                onClick={handleJoin}
                disabled={roomCode.length !== 6}
              >
                Join
              </button>
            </div>
          )}

          <button type="button" onClick={handleCreate}>
            Create Lobby
          </button>
        </div>

        {message && (
          <p className="lobby-message" role="status">
            {message}
          </p>
        )}
      </div>

      <button
        className="settings-button"
        type="button"
        onClick={() => setMessage('Settings — coming soon!')}
      >
        Settings
      </button>

      <button
        className="logout-button"
        type="button"
        onClick={onLogout}
      >
        Log Out
      </button>
    </section>
  );
}
