
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
export type MonsterMode = "idle" | "chasing" | "engaged" | "dead";

export interface MonsterDefinition {
    type: string;
    name: string;
    maxHp: number;
    visionRange: number;
    visionAngle: number;
    detectionBehavior: "vision" | "proximity";
}

export interface MonsterState {
    id: string;
    type: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    hp: number;
    maxHp: number;
    mode: MonsterMode;
}

export type AttackResult = 'PERFECT' | 'GOOD' | 'MISS';

export interface CombatPlayerState {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    hasActed: boolean;
    isAlive: boolean;
}

export interface CombatState {
    id: string;
    monsterId: string;
    roomId: string;
    phase: 'player-turn' | 'enemy-turn' | 'ended';

    players: {
        [username: string]: CombatPlayerState;
    };

    enemy: {
        name: string;
        hp: number;
        maxHp: number;
        isAlive: boolean;
    };

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

    // Combat events

    "start-combat": () => void;

    "get-combat-state": (
        callback: (response: {
            state: CombatState | undefined;
        }) => void
    ) => void;

    "combat-attack": (result: AttackResult) => void;

    "combat-dodge-hit": () => void;

    "combat-dodge-finished": () => void;

    //get seed of dungeon
    "get-dungeon-seed": (
        callback: (response: { seed: number | undefined }) => void
    ) => void;
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

    // Combat events

    "combat-started": (state: CombatState) => void;

    "combat-updated": (state: CombatState) => void;

    "combat-phase-changed": (state: CombatState) => void;

    "combat-ended": (state: CombatState) => void;

    "monster-defeated": (monsterId: string) => void;

    "monster-update": (monsters: MonsterState[]) => void;
}