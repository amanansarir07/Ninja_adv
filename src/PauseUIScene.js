import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'
import { applyAudioSettings, loadSettings, toggleControlsHints, toggleMute } from './settings.js'

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
    applyAudioSettings(this)
    this.isHandlingAction = false
    this.inputUnlockAt = this.time.now + 260
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
    this.layout = {
      cx: screenWidth / 2,
      cy: screenHeight / 2,
      panelW: 620,
      panelH: 430
    }
    const panelBackground = this.add.graphics()
    panelBackground.fillStyle(0x09121d, 0.9)
    panelBackground.fillRoundedRect(
      this.layout.cx - this.layout.panelW / 2,
      this.layout.cy - this.layout.panelH / 2,
      this.layout.panelW,
      this.layout.panelH,
      20
    )
    panelBackground.lineStyle(2, 0x86b8df, 0.65)
    panelBackground.strokeRoundedRect(
      this.layout.cx - this.layout.panelW / 2,
      this.layout.cy - this.layout.panelH / 2,
      this.layout.panelW,
      this.layout.panelH,
      20
    )
    this.createPauseTitle()
    this.createButtonSection()
  }

  createPauseTitle() {
    const screenWidth = this.layout.cx
    const screenHeight = this.layout.cy
    
    let titleText
    try {
      titleText = this.add.text(screenWidth, screenHeight - 154, 'PAUSED', {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '34px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating pause title text:', error)
      titleText = this.add.text(screenWidth, screenHeight - 154, 'PAUSED', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    }
    titleText.setShadow(0, 0, '#67a8d8', 5)
    
    this.titleText = titleText
  }

  createButtonSection() {
    const screenWidth = this.layout.cx
    const screenHeight = this.layout.cy
    const resumeButton = this.createButton(
      screenWidth, screenHeight - 72, 'Continue', () => this.resumeGame(), { width: 360, height: 56, fontSize: 18 }
    )
    const restartButton = this.createButton(
      screenWidth, screenHeight - 8, 'Restart Level', () => this.restartLevel(), { width: 360, height: 56, fontSize: 18 }
    )
    const homeButton = this.createButton(
      screenWidth, screenHeight + 56, 'Back to Menu', () => this.backToMenu(), { width: 360, height: 56, fontSize: 18 }
    )
    const settings = loadSettings()
    const muteButton = this.createButton(
      screenWidth - 96,
      screenHeight + 130,
      settings.musicMuted ? 'Unmute' : 'Mute',
      () => this.toggleMuteFromPause(),
      { width: 180, height: 50, fontSize: 16 }
    )
    const hintsButton = this.createButton(
      screenWidth + 96,
      screenHeight + 130,
      settings.showControlsHints ? 'Hide hints' : 'Show hints',
      () => this.toggleHintsFromPause(),
      { width: 180, height: 50, fontSize: 16 }
    )
    this.resumeButton = resumeButton
    this.restartButton = restartButton
    this.homeButton = homeButton
    this.muteButton = muteButton
    this.hintsButton = hintsButton

    this.keyboardHint = this.add.text(screenWidth, screenHeight + 188, 'ESC/ENTER: Continue   R: Restart   M: Menu', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '12px',
      fill: '#9ec9e9',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
  }

  createButton(x, y, text, callback, options = {}) {
    const width = options.width || 280
    const height = options.height || 60
    const fontSize = options.fontSize || 20
    const halfW = width / 2
    const halfH = height / 2
    const buttonBg = this.add.graphics()
    buttonBg.fillStyle(0x152233, 0.8)
    buttonBg.fillRoundedRect(-halfW, -halfH, width, height, 10)
    buttonBg.lineStyle(1, 0x8ab5d8, 0.45)
    buttonBg.strokeRoundedRect(-halfW, -halfH, width, height, 10)
    buttonBg.setPosition(x, y)
    let buttonText
    try {
      buttonText = this.add.text(x, y, text, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: `${fontSize}px`,
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating button text:', error)
      buttonText = this.add.text(x, y, text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${fontSize}px`,
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    }
    const buttonZone = this.add.zone(x, y, width, height)
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
        buttonBg.fillStyle(0x2e628f, 0.82)
        buttonBg.fillRoundedRect(-halfW, -halfH, width, height, 10)
        buttonBg.lineStyle(1, 0xaed8ff, 0.65)
        buttonBg.strokeRoundedRect(-halfW, -halfH, width, height, 10)
        buttonText.setFill('#e8f6ff')
        
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
        buttonBg.fillStyle(0x152233, 0.8)
        buttonBg.fillRoundedRect(-halfW, -halfH, width, height, 10)
        buttonBg.lineStyle(1, 0x8ab5d8, 0.45)
        buttonBg.strokeRoundedRect(-halfW, -halfH, width, height, 10)
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

  toggleMuteFromPause() {
    const settings = toggleMute(this)
    this.muteButton.text.setText(settings.musicMuted ? 'Unmute' : 'Mute')
  }

  toggleHintsFromPause() {
    const settings = toggleControlsHints()
    this.hintsButton.text.setText(settings.showControlsHints ? 'Hide hints' : 'Show hints')
  }

  setupInputs() {
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
    this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
  }

  resumeGame() {
    if (this.isHandlingAction) return
    this.isHandlingAction = true
    this.scene.resume("UIScene")
    this.scene.resume(this.currentLevelKey)
    this.scene.stop()
  }

  restartLevel() {
    if (this.isHandlingAction) return
    this.isHandlingAction = true
    const currentScene = this.scene.get(this.currentLevelKey)
    if (currentScene && currentScene.backgroundMusic) currentScene.backgroundMusic.stop()
    this.scene.stop(this.currentLevelKey)
    this.scene.stop("UIScene")
    this.scene.stop()
    this.scene.start(this.currentLevelKey)
  }

  backToMenu() {
    if (this.isHandlingAction) return
    this.isHandlingAction = true
    this.scene.stop(this.currentLevelKey)
    this.scene.stop("UIScene")
    this.sound.stopAll()
    this.scene.stop()
    this.scene.start("TitleScreen")
  }

  update() {
    if (this.isHandlingAction) return
    if (this.time.now < this.inputUnlockAt) return

    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.resumeGame()
      return
    }
    if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
      this.restartLevel()
      return
    }
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      this.backToMenu()
    }
  }
}
