
import Phaser from 'phaser';
import { socket } from '../../socket';

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;



export default class DungeonScene extends Phaser.Scene {
  private other_players!: Phaser.Physics.Arcade.Sprite[];
  private player!: Phaser.Physics.Arcade.Sprite
  private lastEmitTime = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private playerColors = [
  0xff4d4d, // Red
  0x4caf50, // Green
  0x4287f5, // Blue
  0xffd43b, // Yellow
  ];

  constructor() {
    super('DungeonScene');
  }

  create() {
    // Create simple placeholder textures.
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x38363b);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('floor', TILE_SIZE, TILE_SIZE);

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
          walls.create(px, py, 'wall');
        } else {
          this.add.image(px, py, 'floor');
        }
      }
    }
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
          const colorIndex = res.room!.users.indexOf(user) % this.playerColors.length;
          player.setTint(this.playerColors[colorIndex]);

          player.setCollideWorldBounds(true);
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
          nickname.setDepth(2);
          player.setData('nickname', nickname);
          this.physics.add.collider(player, walls);
          if (player.name == name) {
            this.player = player;
          } else {
            this.other_players.push(player);
          }
        })

      })
    })

    socket.on('player-pos-update', (username, {x, y}) => {
      const update = this.other_players.find(player => player.name === username);
      if(update){
        update.setX(x);
        update.setY(y);
      }
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
  }

  update() {
    if (!this.player || !this.cursors || !this.wasd) return;
    const currTime = this.time.now;

    if(currTime - this.lastEmitTime >= 30){
      socket.emit("send-location", this.player.x, this.player.y);
      this.lastEmitTime = currTime;
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
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      body.setVelocityY(speed);
    }

    body.velocity.normalize().scale(speed);
  }
}
