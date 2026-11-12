
import Phaser from 'phaser';
import { socket } from '../../socket';
import Zombie from '../monsters/Zombie';
import { spawnMonster } from '../monsters/SpawnMonster';
import DungeonRenderer from "./DungeonRenderer";
import { generateDungeon } from "../../../../server/functions/MapGenerator";
import type { GeneratedDungeon } from '../../../../server/functions/MapGenerator';

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;


export default class DungeonScene extends Phaser.Scene {

  //preload the new textures and animations
  preload() {

  //preload floor textures
  this.load.spritesheet('dungeon-floors', 'tiles/dungeon-floors.png',{
    frameWidth:16,
    frameHeight:16
  });

  //preload wall textures
  this.load.spritesheet('dungeon-walls', 'tiles/dungeon-walls.png',{
    frameWidth:16,
    frameHeight:16
  });
  
  //preload player walking animations
  this.load.spritesheet('player-walk', 'sprites/player/walk.png', {
  frameWidth: 64,
  frameHeight: 64
  });

  //preload player idle animations
  this.load.spritesheet('player-idle', 'sprites/player/idle.png', {
  frameWidth: 64,
  frameHeight: 64
  });

  //preload zombie idle animation
  this.load.spritesheet('zombie-idle', 'sprites/zombie/idle.png',{
    frameWidth: 64,
    frameHeight: 64
  })

}

  //map out indexes to different wall tiles
  private WALL_TILES = {
      topLeft: 4,
      topRight: 4,
      bottomLeft: 5,
      bottomRight: 5,

      top: 2,
      bottom: 1,
      left: 3,
      right: 3,
    };

  //helper function to distinguish wall tiles, will need tweaking for new room system
  private getWallTile(x: number, y: number): number {
  switch (true) {
    case x === 0 && y === 0:
      return this.WALL_TILES.topLeft;

    case x === MAP_WIDTH - 1 && y === 0:
      return this.WALL_TILES.topRight;

    case x === 0 && y === MAP_HEIGHT - 1:
      return this.WALL_TILES.bottomLeft;

    case x === MAP_WIDTH - 1 && y === MAP_HEIGHT - 1:
      return this.WALL_TILES.bottomRight;

    case y === 0:
      return this.WALL_TILES.top;

    case y === MAP_HEIGHT - 1:
      return this.WALL_TILES.bottom;

    case x === 0:
      return this.WALL_TILES.left;

    default:
      return this.WALL_TILES.right;
  }
}
  
  private dungeonRenderer!: DungeonRenderer;
  private generatedDungeon!: GeneratedDungeon;

  private other_players!: Phaser.Physics.Arcade.Sprite[];

  private remotePositions = new Map<string, { x: number; y: number }>();
  private remoteLastMoved = new Map<string, number>();
  private remoteFacingDirection = new Map <string,string>();
  private player!: Phaser.Physics.Arcade.Sprite

  //lasst faced, direction (for idle animation side detection)
  private facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private lastEmitTime = 0;
  private lastEmittedPos: { x: number, y: number } | undefined;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private zombie!: Zombie;

  constructor() {
    super('DungeonScene');
  }

  create() {

    console.log("1. DungeonScene create started");

    this.dungeonRenderer = new DungeonRenderer(this, 32);

    console.log("2. Requesting dungeon seed");

    socket.emit("get-dungeon-seed", (response) => {
        console.log("3. Seed callback received:", response);

        const { seed } = response;

        if (seed === undefined) {
            console.error("4. Server did not return a seed");
            return;
        }

        console.log("5. Starting dungeon generation");

        const dungeon = generateDungeon({
            width: 100,
            height: 100,
            floor: 1,
            seed,
            extraConnectionChance: 0.35,
            placementAttempts: 200
        });

        console.log("6. Dungeon generated:", dungeon);

        this.dungeonRenderer.render(dungeon);

        console.log("7. Dungeon rendered");
    });

        //define the frames of animations
    //player walking
    this.anims.create({
    key: 'walk-up',
    frames: this.anims.generateFrameNumbers('player-walk', {
      start: 0,
      end: 8,
    }),
    frameRate: 16,
    repeat: -1,
  });
    this.anims.create({
    key: 'walk-left',
    frames: this.anims.generateFrameNumbers('player-walk', {
      start: 13,
      end: 21,
    }),
    frameRate: 16,
    repeat: -1,
  });
    this.anims.create({
    key: 'walk-down',
    frames: this.anims.generateFrameNumbers('player-walk', {
      start: 26,
      end: 34,
    }),
    frameRate: 16,
    repeat: -1,
  });
    this.anims.create({
    key: 'walk-right',
    frames: this.anims.generateFrameNumbers('player-walk', {
      start: 39,
      end: 47,
    }),
    frameRate: 16,
    repeat: -1,
  });
    //player idle
    this.anims.create({
    key: 'idle-up',
    frames: this.anims.generateFrameNumbers('player-idle', {
      start: 0,
      end: 1,
    }),
    frameRate: 2,
    repeat: -1,
  });
    this.anims.create({
    key: 'idle-left',
    frames: this.anims.generateFrameNumbers('player-idle', {
      start: 13,
      end: 14,
    }),
    frameRate: 2,
    repeat: -1,
  });
    this.anims.create({
    key: 'idle-down',
    frames: this.anims.generateFrameNumbers('player-idle', {
      start: 26,
      end: 27,
    }),
    frameRate: 2,
    repeat: -1,
  });
    this.anims.create({
    key: 'idle-right',
    frames: this.anims.generateFrameNumbers('player-idle', {
      start: 39,
      end: 40,
    }),
    frameRate: 2,
    repeat: -1,
  });
    //zombie idle
    this.anims.create({
    key: 'zombie-idle-up',
    frames: this.anims.generateFrameNumbers('zombie-idle', {
      start: 0,
      end: 1,
    }),
    frameRate: 2,
    repeat: -1,
  });
    this.anims.create({
    key: 'zombie-idle-left',
    frames: this.anims.generateFrameNumbers('zombie-idle', {
      start: 13,
      end: 14,
    }),
    frameRate: 2,
    repeat: -1,
  });
    this.anims.create({
    key: 'zombie-idle-down',
    frames: this.anims.generateFrameNumbers('zombie-idle', {
      start: 26,
      end: 27,
    }),
    frameRate: 2,
    repeat: -1,
  });
    this.anims.create({
    key: 'zombie-idle-right',
    frames: this.anims.generateFrameNumbers('zombie-idle', {
      start: 39,
      end: 40,
    }),
    frameRate: 2,
    repeat: -1,
  });

    
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.clear();
    graphics.fillStyle(0x171619);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(2, 0x49454b);
    graphics.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    graphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0xc99b65);
    graphics.fillRect(5, 5, 22, 22);
    graphics.lineStyle(2, 0x30251e);
    graphics.strokeRect(5, 5, 22, 22);
    graphics.generateTexture('player', TILE_SIZE, TILE_SIZE);

    graphics.destroy();

    // Draw the dungeon floor and walls.
    const walls = this.physics.add.staticGroup();

//     for (let y = 0; y < MAP_HEIGHT; y++) {
//       for (let x = 0; x < MAP_WIDTH; x++) {
//         const isWall =
//           x === 0 ||
//           y === 0 ||
//           x === MAP_WIDTH - 1 ||
//           y === MAP_HEIGHT - 1;

//         const px = x * TILE_SIZE + TILE_SIZE / 2;
//         const py = y * TILE_SIZE + TILE_SIZE / 2;

//         if (isWall) {
//           let tileIndex: number;
//           tileIndex = this.getWallTile(x, y);

//           const wall = walls.create(px, py, 'dungeon-walls', tileIndex);
//           wall.setScale(2);
//           wall.refreshBody();
// } else {
 
//           this.add.image(px, py, 'dungeon-floors',0).setScale(2);
//         }
//       }
//     }

    socket.off("combat-started");
    socket.off("monster-update");

    socket.on("monster-update", (state) => {
      this.zombie?.setServerState(state);
  });

    socket.on("combat-started", (state) => {
      if (this.scene.isActive("CombatScene")) return;

      this.scene.launch("CombatScene", { state });
      this.scene.pause();
    });
    
    this.other_players = [];


    socket.emit("get-name", (res) => {
      const name = res.name;

      socket.emit("get-room", (res) => {
        res.room?.users.forEach((user) => {
          const player = this.physics.add.sprite(
            TILE_SIZE * 4,
            TILE_SIZE * 4,
            'player',
          )
          player.name = user.username;

          player.setCollideWorldBounds(true);
          if(player.name == name)
          player.setDepth(1);
          const nickname = this.add.text(
          player.x,
          player.y - 24,
          user.username,
          {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#171619',
            padding: { x: 4, y: 2 },
          },
          );

          nickname.setOrigin(0.5, 1);
          //make local player nick always on top
          nickname.setDepth(player.name === name ? 11 : 2);
          player.setData('nickname', nickname);
          this.physics.add.collider(player, walls);

          //make local player always on top
          if (player.name === name) {
            this.player = player;
            this.player.setDepth(10);
            this.zombie = spawnMonster(this,Zombie,300,300);
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
          } else {
            player.setDepth(1);
            this.other_players.push(player);
          }
        })

      })
    })

    this.events.once('enemy-defeated', () => {
    this.zombie?.destroy();

});
    socket.on("combat-started", (state) => {
    this.scene.launch("CombatScene", { state });
    this.scene.pause();
});

    socket.on('player-pos-update', (username, {x, y}) => {
      const update = this.other_players.find(player => player.name === username);
      //check if player exists
      if(!update) return;
      //set time last moved to enable detecting if player is idle
      this.remoteLastMoved.set(username, this.time.now);

      //get previous position
      const previous = this.remotePositions.get(username);
      if (previous) {
        //calculate delta of positions
        const dx = x - previous.x;
        const dy = y - previous.y;

        //set animations based on calculated deltas
        if (Math.abs(dx) > Math.abs(dy)) {
          if(dx > 0){
            this.remoteFacingDirection.set(username,"right");
          }else{
            this.remoteFacingDirection.set(username,"left");
          }
          update.anims.play(dx > 0 ? 'walk-right' : 'walk-left', true);
        } else if (Math.abs(dy) > 0) {
          if(dy > 0){
            this.remoteFacingDirection.set(username,"down");
          }else{
            this.remoteFacingDirection.set(username,"up");
          }
          update.anims.play(dy > 0 ? 'walk-down' : 'walk-up', true);
        }
      }
      //update previous position
      this.remotePositions.set(username, { x, y });

      //update player position
      update.setX(x);
      update.setY(y);
      
    })
    // this.player = this.physics.add.sprite(
    //   TILE_SIZE * 4,
    //   TILE_SIZE * 4,
    //   'player'
    // );

    // this.player.setCollideWorldBounds(true);
    // this.player.setDepth(1);

    // this.physics.add.collider(this.player, walls);

    // Keyboard controls.
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();

    this.wasd = this.input.keyboard.addKeys(
      'W,A,S,D'
    ) as typeof this.wasd;

    this.add.text(12, 12, 'WASD / Arrow Keys to move', {
      fontSize: '16px',
      color: '#f5f3ee',
      backgroundColor: '#171619',
      padding: { x: 8, y: 6 },
    }).setScrollFactor(0).setDepth(2);

    
    // Developer button to test combat.
    const devButton = this.add.text(
      12,
      48,
      '[ DEV ] TEST COMBAT',
      {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#8b2929',
        padding: { x: 8, y: 6 },
      }
    );

    devButton
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    devButton.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('CombatScene');
    });
  }
  

  update() {
    this.zombie?.update();

    if (!this.player || !this.cursors || !this.wasd) return;
    const currTime = this.time.now;

    if(currTime - this.lastEmitTime >= 30 && (!this.lastEmittedPos || (this.lastEmittedPos.x !== this.player.x || this.lastEmittedPos.y !== this.player.y))){
      socket.emit("send-location", this.player.x, this.player.y);
      this.lastEmitTime = currTime;
      this.lastEmittedPos = { x: this.player.x, y: this.player.y };
    }
    Array.from([...this.other_players, this.player]).forEach((player: Phaser.Physics.Arcade.Sprite) => {
      const label = player.getData('nickname');
      label.setPosition(player.x, player.y - 24);
    });


    const speed = 160;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      body.setVelocityX(-speed);
      this.facingDirection = "left";
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      body.setVelocityX(speed);
      this.facingDirection = "right";
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      body.setVelocityY(-speed);
      this.facingDirection = "up";
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      body.setVelocityY(speed);
      this.facingDirection = "down";
    }

    body.velocity.normalize().scale(speed);
    // console.log(body.velocity)
    if (body.velocity.x < 0) {
    this.player.anims.play('walk-left', true);
  } else if (body.velocity.x > 0) {
    this.player.anims.play('walk-right', true);
  } else if (body.velocity.y < 0) {
    this.player.anims.play('walk-up', true);
  } else if (body.velocity.y > 0) {
    this.player.anims.play('walk-down', true);
  } else {
    //else player is idle, so play idle based on last facing
    this.player.anims.play(`idle-${this.facingDirection}`, true);
  }
  //check if other players are idle, then play animation
    for (const player of this.other_players) {
      const lastMoved = this.remoteLastMoved.get(player.name);

      if (lastMoved === undefined) continue;

      if (this.time.now - lastMoved > 150) {
        player.anims.play(`idle-${this.remoteFacingDirection.get(player.name)}`, true);
      }
    }
  }

  
  
}
