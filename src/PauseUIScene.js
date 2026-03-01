import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class PauseUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "PauseUIScene",
    })
  }

  init(data) {
    this.currentLevelKey = data.currentLevelKey || "Level1Scene"
  }

  create() {
    this.createBackgroundOverlay()
    this.createPauseUI()
    this.setupInputs()
  }

  createBackgroundOverlay() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.overlay = this.add.graphics()
    this.overlay.fillStyle(0x000000, 0.7)
    this.overlay.fillRect(0, 0, screenWidth, screenHeight)
    this.overlay.setInteractive()
  }

  createPauseUI() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    const panelBackground = this.add.graphics()
    panelBackground.fillStyle(0x1a1a1a, 0.95)
    panelBackground.fillRoundedRect(-200, -150, 400, 300, 20)
    panelBackground.lineStyle(4, 0x4a90e2, 1)
    panelBackground.strokeRoundedRect(-200, -150, 400, 300, 20)
    panelBackground.setPosition(screenWidth / 2, screenHeight / 2)
    this.createPauseTitle()
    this.createButtonSection()
  }

  createPauseTitle() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    let titleText
    try {
      titleText = this.add.text(screenWidth / 2, screenHeight / 2 - 80, 'GAME PAUSED', {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '36px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating pause title text:', error)
      titleText = this.add.text(screenWidth / 2, screenHeight / 2 - 80, 'GAME PAUSED', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    }
    titleText.setShadow(0, 0, '#4a90e2', 8)
    
    this.titleText = titleText
  }

  createButtonSection() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    const resumeButton = this.createButton(
      screenWidth / 2, screenHeight / 2 - 10, 'Continue', () => this.resumeGame()
    )
    const homeButton = this.createButton(
      screenWidth / 2, screenHeight / 2 + 60, 'Back to menu', () => this.backToMenu()
    )
    this.resumeButton = resumeButton
    this.homeButton = homeButton
  }

  createButton(x, y, text, callback) {
    const buttonBg = this.add.graphics()
    buttonBg.fillStyle(0x333333, 0.9)
    buttonBg.fillRoundedRect(-140, -30, 280, 60, 10)
    buttonBg.lineStyle(2, 0x666666, 1)
    buttonBg.strokeRoundedRect(-140, -30, 280, 60, 10)
    buttonBg.setPosition(x, y)
    let buttonText
    try {
      buttonText = this.add.text(x, y, text, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating button text:', error)
      buttonText = this.add.text(x, y, text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    }
    const buttonZone = this.add.zone(x, y, 280, 60)
    buttonZone.setInteractive()
      .on('pointerdown', () => {
        this.tweens.add({
          targets: [buttonBg, buttonText],
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            callback()
          }
        })
        if (this.sound.get("ui_click_sound")) {
          this.sound.play("ui_click_sound", { volume: 0.3 })
        }
      })
      .on('pointerover', () => {
        buttonBg.clear()
        buttonBg.fillStyle(0x4a90e2, 0.9)
        buttonBg.fillRoundedRect(-140, -30, 280, 60, 10)
        buttonBg.lineStyle(2, 0x6bb6ff, 1)
        buttonBg.strokeRoundedRect(-140, -30, 280, 60, 10)
        buttonText.setFill('#ffff00')
        
        this.tweens.add({
          targets: [buttonBg, buttonText],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: 'Back.easeOut'
        })
      })
      .on('pointerout', () => {
        buttonBg.clear()
        buttonBg.fillStyle(0x333333, 0.9)
        buttonBg.fillRoundedRect(-140, -30, 280, 60, 10)
        buttonBg.lineStyle(2, 0x666666, 1)
        buttonBg.strokeRoundedRect(-140, -30, 280, 60, 10)
        buttonText.setFill('#ffffff')
        
        this.tweens.add({
          targets: [buttonBg, buttonText],
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Back.easeOut'
        })
      })
    return {
      bg: buttonBg,
      text: buttonText,
      zone: buttonZone
    }
  }

  setupInputs() {
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  resumeGame() {
    this.scene.resume(this.currentLevelKey)
    this.scene.stop()
  }

  backToMenu() {
    this.scene.stop(this.currentLevelKey)
    this.scene.stop("UIScene")
    this.sound.stopAll()
    this.scene.stop()
    this.scene.start("TitleScreen")
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || 
        Phaser.Input.Keyboard.JustDown(this.spaceKey) || 
        Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.resumeGame()
    }
  }
}
