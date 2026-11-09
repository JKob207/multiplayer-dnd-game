
import Phaser from 'phaser';
import { socket } from '../../socket';

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

  private zombie!: Phaser.GameObjects.Arc;
  private visionCone!: Phaser.GameObjects.Graphics;
  private zombieTargetX = 400;
  private zombieTargetY = 300;
  private zombieAngle = 0;
  private zombieMode: "idle" | "chasing" | "engaged" = "idle";

  private drawVisionCone() {
  if (!this.zombie || !this.visionCone) return;

  const range = 250;
  const halfAngle = Math.PI / 4;
  const steps = 30;

  this.visionCone.clear();
  this.visionCone.fillStyle(0xff3333, 0.18);

  this.visionCone.beginPath();
  this.visionCone.moveTo(this.zombie.x, this.zombie.y);

  for (let i = 0; i <= steps; i++) {
    const angle =
      this.zombieAngle - halfAngle +
      (i / steps) * halfAngle * 2;

    const x = this.zombie.x + Math.cos(angle) * range;
    const y = this.zombie.y + Math.sin(angle) * range;

    this.visionCone.lineTo(x, y);
  }

  this.visionCone.closePath();
  this.visionCone.fillPath();
}

 private createZombie() {
  this.zombie = this.add.circle(
    400,
    300,
    18,
    0x35c759
  );

  this.zombie.setDepth(3);

  this.visionCone = this.add.graphics();
  this.visionCone.setDepth(2);

  this.drawVisionCone();
}

  constructor() {
    super('DungeonScene');
  }

  create() {
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

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const isWall =
          x === 0 ||
          y === 0 ||
          x === MAP_WIDTH - 1 ||
          y === MAP_HEIGHT - 1;

        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        if (isWall) {
          let tileIndex: number;
          tileIndex = this.getWallTile(x, y);

          const wall = walls.create(px, py, 'dungeon-walls', tileIndex);
          wall.setScale(2);
          wall.refreshBody();
} else {
 
          this.add.image(px, py, 'dungeon-floors',0).setScale(2);
        }
      }
    }

    socket.off("combat-started");
    socket.off("monster-update");

    socket.on("monster-update", (state) => {
      this.zombieTargetX = state.x;
      this.zombieTargetY = state.y;
      this.zombieAngle = state.angle;
      this.zombieMode = state.mode;
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
            this.createZombie();
          } else {
            player.setDepth(1);
            this.other_players.push(player);
          }
        })

      })
    })
    this.events.once('enemy-defeated', () => {
    this.zombie.destroy();
    this.visionCone.destroy();
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
    if (this.zombie?.active && this.zombieMode !== "engaged") {
  // Smoothly move toward the server position.
  this.zombie.x = Phaser.Math.Linear(
    this.zombie.x,
    this.zombieTargetX,
    0.15
  );

  this.zombie.y = Phaser.Math.Linear(
    this.zombie.y,
    this.zombieTargetY,
    0.15
  );

  this.drawVisionCone();
}
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
