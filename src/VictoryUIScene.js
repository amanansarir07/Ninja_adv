import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class VictoryUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "VictoryUIScene",
    })
  }

  init(data) {
    this.currentLevelKey = data.currentLevelKey
  }

  create() {
    this.isTransitioning = false
    this.scene.pause(this.currentLevelKey)
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.7)

    const saved = this.registry.get('seaCreaturesSaved') || 0
    const difficulty = this.registry.get('difficultyLabel') || 'Normal'
    const levelScene = this.scene.get(this.currentLevelKey)
    const elapsed = levelScene && levelScene.getElapsedSeconds ? levelScene.getElapsedSeconds() : 0
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
    const ss = String(elapsed % 60).padStart(2, '0')
    this.victoryText = this.add.text(screenWidth / 2, screenHeight / 2 - 80, 'DEPTH CLEAR!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '56px',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.savedSubtext = this.add.text(screenWidth / 2, screenHeight / 2 - 15, `${saved} sea creature${saved !== 1 ? 's' : ''} saved so far`, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '20px',
      fill: '#87ceeb',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.statsSubtext = this.add.text(screenWidth / 2, screenHeight / 2 + 15, `Difficulty: ${difficulty}  |  Time: ${mm}:${ss}`, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '18px',
      fill: '#ffd36b',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.nextLevelText = this.add.text(screenWidth / 2, screenHeight / 2 + 70, 'Press Enter to dive deeper', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.tweens.add({
      targets: this.nextLevelText,
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
      this.goToNextLevel()
    }
  }

  goToNextLevel() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.sound.play("ui_click_sound", { volume: 0.3 })
    const currentScene = this.scene.get(this.currentLevelKey)
    const nextLevelKey = currentScene.getNextLevelScene()
    if (currentScene && currentScene.backgroundMusic) {
      currentScene.backgroundMusic.stop()
    }
    if (nextLevelKey) {
      this.scene.stop(this.currentLevelKey)
      this.scene.stop("UIScene")
      this.scene.stop()
      this.scene.start(nextLevelKey)
    } else {
      this.scene.stop(this.currentLevelKey)
      this.scene.stop("UIScene")
      this.scene.stop()
      this.scene.start("TitleScreen")
    }
  }
}
