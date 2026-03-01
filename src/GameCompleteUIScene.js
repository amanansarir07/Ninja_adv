import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class GameCompleteUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "GameCompleteUIScene",
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

    const totalSaved = this.registry.get('seaCreaturesSaved') || 0
    this.completeText = this.add.text(screenWidth / 2, screenHeight / 2 - 110, 'YOU SAVED THE DEEP', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '52px',
      fill: '#ffd700',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.congratsText = this.add.text(screenWidth / 2, screenHeight / 2 - 45, `${totalSaved} sea creature${totalSaved !== 1 ? 's' : ''} saved. Thank you.`, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '26px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.themeText = this.add.text(screenWidth / 2, screenHeight / 2 + 15, 'You made a difference.', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '18px',
      fill: '#87ceeb',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.menuText = this.add.text(screenWidth / 2, screenHeight / 2 + 95, 'Press Enter to return to menu', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.tweens.add({
      targets: this.menuText,
      alpha: 0.3,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    this.tweens.add({
      targets: this.completeText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.returnToMenu()
    }
  }

  returnToMenu() {
    this.sound.play("ui_click_sound", { volume: 0.3 })
    const currentScene = this.scene.get(this.currentLevelKey)
    if (currentScene && currentScene.backgroundMusic) {
      currentScene.backgroundMusic.stop()
    }
    this.scene.stop(this.currentLevelKey)
    this.scene.stop("UIScene")
    this.scene.stop()
    this.scene.start("TitleScreen")
  }
}
