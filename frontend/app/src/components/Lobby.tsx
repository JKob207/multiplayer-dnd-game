
import { useState, useEffect } from 'react';
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleRoomUpdated = (update: Room) => {
      setRoom(update);
    };

    socket.on('room-updated', handleRoomUpdated);

    return () => {
      socket.off('room-updated', handleRoomUpdated);
    };
  }, []);
  function handleJoin() {
    if (roomCode.length !== 6) {
      setMessage('Please enter a 6-character room code.');
      return;
    }

    socket.emit("join-room", roomCode, res => {
      if (res.success) {
        setRoom(res.room);
        console.log(res.room);

        return;
      }

      setMessage('Theres no such room.');
    })
  }

  function handleCreate() {
    socket.emit("create-room", res => {
      setRoom(res.room);
      console.log(res.room);
    })
  }

  function handleReady() {
    if (!room) return;

    socket.emit("start-game", res => {
      if (res.success) {
        setRoom(res.room);
        const me = room.users.find(user => user.id === socket.id);
        setIsReady(me?.ready || false);
      }
    })
  }


  function handleLeavingLobby() {
    socket.emit("leave-room", res => {
      if (res.success) {
        setRoom(undefined);
        setIsReady(false);
        setShowJoin(false);
        setMessage('');
        setRoomCode('');
      }
    })
  }


  return (
    <section className="lobby">
      {!room ? (
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
      ) : (
        <div className="room-view">
          <h1>Game Lobby</h1>


          <div className="players-panel">
            <h2>Players ({room.users.length})</h2>

            <div className="player-list">
              {room.users.map((user) => (
                <div className="player-row" key={user.id}>
                  <span>
                    {user.username}
                    {' '}
                    {user.host && ' (Host) '}
                  </span>

                  <span className={user.ready ? 'ready-status' : 'not-ready-status'}>
                    {user.ready ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>


          <div className="room-code-panel">
            <p>Room Code</p>
            <h2>{room.id}</h2>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(room.id);
                setMessage('Room code copied!');
              }}
            >
              Copy Code
            </button>
          </div>


          {message && (
            <p className="lobby-message" role="status">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={handleReady}
            className={isReady ? 'is-ready' : ''}
          >
            {isReady ? 'Not Ready' : 'Ready Up'}

          </button>
        </div>
      )}

      <button
        className="settings-button"
        type="button"
        onClick={() => setMessage('Settings — coming soon!')}
      >
        Settings
      </button>

      {room && (
        <button
          className="leave-lobby-button"
          type="button"
          onClick={handleLeavingLobby}
        >
          Leave Lobby
        </button>
      )}

      <button
        className="logout-button"
        type="button"
        onClick={onLogout}
      >
        Log Out
      </button>
    </section>
  )
};