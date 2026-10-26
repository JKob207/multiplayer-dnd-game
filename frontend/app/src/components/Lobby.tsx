
import { useState } from 'react';
import './Lobby.css';
import { socket } from '../../socket';
import type { Room } from "../../../../shared/interfaces"
type LobbyProps = {
  onLogout: () => void;
};

export default function Lobby({ onLogout }: LobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [message, setMessage] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [room, setRoom] = useState<Room | undefined>();

  socket.on("room-updated", update => {
    setRoom(update);
  })
  function handleJoin() {
    if (roomCode.length !== 6) {
      setMessage('Please enter a 6-character room code.');
      return;
    }

    socket.emit("join-room", roomCode, res => {
      if (!res.success) {
        setMessage('Theres no such room.');
        return;
      }

      setRoom(res.room);
      console.log(res.room);
    })
  }

  function handleCreate() {
    socket.emit("create-room", res => {
      setRoom(res.room);
      console.log(res.room);
    })
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

        {room && (
          <p className="lobby-message" role="status">
            {room.users.map(user => (
              <span key={user.id}>
                {user.username} 
              </span>
            ))}
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
