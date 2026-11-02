
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import DungeonScene from '../game/DungeonScene';

export default function GameCanvas() {
  const gameContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameContainer.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 576,
      parent: gameContainer.current,
      backgroundColor: '#0c0c0e',
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scene: [DungeonScene],
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={gameContainer}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    />
  );
}
