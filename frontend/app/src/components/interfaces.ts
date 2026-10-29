import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../../../../shared/interfaces";

export interface GameConfig extends Phaser.Types.Core.GameConfig {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}