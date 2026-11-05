
export interface Room {
    id: string;
    users: {
        username: string;
        host: boolean;
        ready: boolean;
    }[];
    maxPlayers: number;
    status: string;
}
export type AttackResult = 'PERFECT' | 'GOOD' | 'MISS';

export type CombatPhase = 'player-turn' | 'enemy-turn' | 'ended';

export interface CombatEnemy {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  armor: number;
}

export interface CombatPlayer {
  hp: number;
  maxHp: number;
}

export interface CombatState {
  enemy: CombatEnemy;
  players: Record<string, CombatPlayer>;
  phase: CombatPhase;
  active: boolean;
  round: number;
  result?: 'victory' | 'defeat';
}
export interface ClientToServerEvents {
    "get-room": (
        callback: (response: {
            room: Room | undefined;
        }) => void
    ) => void;

    "get-isReady": (
        callback: (response: {
            isReady: boolean;
        }) => void
    ) => void;

    "get-name": (
        callback: (response: {
            name: string;
        }) => void
    ) => void;

    "create-room": (
        callback: (response: {
            success: boolean;
            room?: Room;
        }) => void
    ) => void;

    "join-room": (
        roomId: string,
        callback: (response: {
            success: boolean;
            room?: Room;
            message?: string;
        }) => void
    ) => void;

    "toggle-ready": (
        callback: (response: {
            success: boolean;
            room: Room;
        }) => void
    ) => void;

    "leave-room": (
        callback: (response: {
            success: boolean;
        }) => void
    ) => void;

    "send-location": (
        x: number,
        y: number,
    ) => void;

    "start-combat": () => void;

    "combat-attack": (
    result: AttackResult
    ) => void;

    "combat-dodge-hit": () => void;

    "combat-dodge-finished": () => void;
}

export interface ServerToClientEvents {
    "room-updated": (room: Room) => void;
    "start-game": () => void;
    "player-pos-update": (
        name: string,
        position: {
            x: number,
            y: number
        }
    ) => void;

    "combat-started": (
    state: CombatState
    ) => void;

    "combat-updated": (
    state: CombatState
    ) => void;

    "combat-phase-changed": (
    state: CombatState
    ) => void;

    "combat-ended": (
    state: CombatState
    ) => void;
}
