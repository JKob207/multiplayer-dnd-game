
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import DungeonScene from '../game/DungeonScene';
import CombatScene from '../game/CombatScene';

export default function GameCanvas() {
  const gameContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameContainer.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width:  window.innerWidth,
      height: window.innerHeight,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      parent: gameContainer.current,
      backgroundColor: '#0c0c0e',
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scene: [DungeonScene,CombatScene],
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className='game_div'
      ref={gameContainer}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    />
  );
}
