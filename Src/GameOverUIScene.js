import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class GameOverUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "GameOverUIScene",
    })
  }

  init(data) {
    this.currentLevelKey = data.currentLevelKey
  }

  create() {
    this.scene.pause(this.currentLevelKey)
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.7)
    this.sound.play("game_over_sound", { volume: 0.3 })
    this.gameOverText = this.add.text(screenWidth / 2, screenHeight / 2 - 50, 'GAME OVER', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '64px',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.retryText = this.add.text(screenWidth / 2, screenHeight / 2 + 50, 'Press Enter to try again', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.tipText = this.add.text(screenWidth / 2, screenHeight / 2 + 88, 'Tip: Keep O2 high and use skills on cooldown.', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#87ceeb',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.tweens.add({
      targets: this.retryText,
      alpha: 0.3,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.restartLevel()
    }
  }

  restartLevel() {
    this.sound.play("ui_click_sound", { volume: 0.3 })
    const currentScene = this.scene.get(this.currentLevelKey)
    if (currentScene && currentScene.backgroundMusic) currentScene.backgroundMusic.stop()
    this.scene.stop(this.currentLevelKey)
    this.scene.stop("UIScene")
    this.scene.stop()
    this.scene.start(this.currentLevelKey)
  }
}
