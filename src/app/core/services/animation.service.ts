import { Injectable } from '@angular/core';
import * as Phaser from 'phaser';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private game: Phaser.Game | null = null;
  private scene: Phaser.Scene | null = null;

  constructor() { }

  initPhaser(container: HTMLElement): void {
    // Create a scene class
    class MainScene extends Phaser.Scene {
      constructor(private readonly animService: AnimationService) {
        super({ key: 'MainScene' });
      }

      preload() {
        // Make this scene available to the service
        this.animService.setScene(this);

        // Only load explosion asset
        this.load.spritesheet('explosion',
          '/assets/images/animations/Explosion/explosion00.png',
          { frameWidth: 64, frameHeight: 64 }
        );
      }

      create() {
        // Create only explosion animation
        this.anims.create({
          key: 'explode',
          frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
          frameRate: 20,
          repeat: 0
        });

        console.log('Phaser initialized and explosion animation created successfully!');
      }
    }

    // Configure and create the game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: container.offsetWidth,
      height: container.offsetHeight,
      parent: container,
      transparent: true,
      physics: {
        default: 'arcade',
        arcade: {}
      },
      scene: [new MainScene(this)]
    };

    this.game = new Phaser.Game(config);
  }

  // Method to set the scene reference
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  playExplosion(x: number, y: number, damage: number): void {
    if (!this.scene) {
      console.error('Phaser scene is not initialized.');
      return;
    }

    // Check if the sprite exists in the cache
    if (!this.scene.textures.exists('explosion')) {
      console.error('Explosion sprite not found. Using fallback.');

      // Create a temporary text for testing
      const damageText = this.scene.add.text(x, y, `-${damage}`, {
        font: '24px Arial',
        color: '#ff0000'
      });

      // Animate the text
      this.scene.tweens.add({
        targets: damageText,
        y: damageText.y - 30,
        alpha: 0,
        duration: 1000,
        onComplete: () => damageText.destroy()
      });

      return;
    }

    const explosion = this.scene.add.sprite(x, y, 'explosion');
    explosion.play('explode');

    // Show damage
    const damageText = this.scene.add.text(x, y - 20, `-${damage}`, {
      font: '20px Arial',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 2
    });

    // Clean up after animation
    explosion.on('animationcomplete', () => {
      explosion.destroy();
      this.scene?.tweens.add({
        targets: damageText,
        y: damageText.y - 30,
        alpha: 0,
        duration: 800,
        onComplete: () => damageText.destroy()
      });
    });
  }

  // Add this method to check if Phaser is ready
  isPhaserReady(): boolean {
    return this.scene !== null;
  }
}
