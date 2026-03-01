import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({
      key: "CharacterSelectScene",
    })
    this.selectedCharacterIndex = 0
    this.isSelecting = false
  }

  init() {
    this.selectedCharacterIndex = 0
    this.isSelecting = false
  }

  create() {
    this.cleanupUIScenes()
    
    this.createBackground()
    this.createTitle()
    this.createCharacterDisplay()
    this.createUI()
    this.setupInputs()
    this.playBackgroundMusic()
    this.updateSelection()
  }

  cleanupUIScenes() {
    try {
      this.scene.stop("UIScene")
      this.scene.stop("PauseUIScene")
      this.scene.stop("VictoryUIScene")
      this.scene.stop("GameOverUIScene")
      this.scene.stop("GameCompleteUIScene")
    } catch (error) {
      console.log("Cleanup UI scenes completed")
    }
  }

  createBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.background = this.add.image(screenWidth / 2, screenHeight / 2, "select_background")
    this.background.setDisplaySize(screenWidth, screenHeight)
  }

  createTitle() {
    const screenWidth = screenSize.width.value
    this.titleText = this.add.text(screenWidth / 2, 70, 'SELECT CHARACTER', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 15, 48) + 'px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.titleText.setShadow(0, 0, '#ffff00', 8)
    this.themeTagline = this.add.text(screenWidth / 2, 115, 'Sea creatures are disappearing. Aquaman fights to save them.', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 48, 16) + 'px',
      fill: '#87ceeb',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
  }

  createCharacterDisplay() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.characters = [
      {
        name: "AQUAMAN",
        key: "sasuke_select",
        description: "Guardian of the Seas\nSaves sea creatures from extinction",
        playerClass: "SasukePlayer"
      },
      {
        name: "NARUTO", 
        key: "naruto_select",
        description: "Nine-Tails Jinchuriki\nRasengan & Shadow Clone",
        playerClass: "NarutoPlayer"
      },
      {
        name: "KAKASHI",
        key: "kakashi_select", 
        description: "The Copy Ninja\nChidori & Sharingan Master",
        playerClass: "KakashiPlayer"
      }
    ]
    const characterY = screenHeight * 0.5
    const characterSpacing = screenWidth / 4
    const startX = screenWidth / 2 - characterSpacing
    this.characterSprites = []
    this.characterNames = []
    this.characterDescriptions = []
    this.selectionFrames = []
    this.characterBorders = []
    this.characterContainers = []
    this.characters.forEach((character, index) => {
      const x = startX + (index * characterSpacing)
      const sprite = this.add.image(x, characterY, character.key)
      const scale = Math.min(200 / sprite.width, 300 / sprite.height)
      sprite.setScale(scale)
      sprite.setOrigin(0.5, 0.5)
      this.characterSprites.push(sprite)
      const frameWidth = 220
      const frameHeight = 300
      const border = this.add.graphics()
      border.lineStyle(3, 0x666666, 0.8)
      border.strokeRoundedRect(x - frameWidth/2, characterY - frameHeight/2, frameWidth, frameHeight, 10)
      this.characterBorders.push(border)
      const nameText = this.add.text(x, characterY + 180, character.name, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '24px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5, 0.5)
      this.characterNames.push(nameText)
      const descText = this.add.text(x, characterY + 220, character.description, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '14px',
        fill: '#cccccc',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: 200 }
      }).setOrigin(0.5, 0.5)
      this.characterDescriptions.push(descText)
      const frame = this.add.graphics()
      frame.lineStyle(4, 0xffff00, 1)
      frame.strokeRoundedRect(
        x - frameWidth/2, 
        characterY - frameHeight/2, 
        frameWidth, 
        frameHeight, 
        10
      )
      frame.setVisible(false)
      this.selectionFrames.push(frame)
      const container = this.add.zone(x, characterY, frameWidth, frameHeight)
      container.setInteractive()
      this.characterContainers.push(container)
    })
  }

  createUI() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.controlsText = this.add.text(screenWidth / 2, screenHeight - 100, 
      'A/D: Select    ENTER/SPACE: Confirm', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '18px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.tweens.add({
      targets: this.controlsText,
      alpha: 0.5,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  setupInputs() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.characterContainers.forEach((container, index) => {
      container.on('pointerdown', () => {
        if (!this.isSelecting) {
          this.selectedCharacterIndex = index
          this.updateSelection()
          this.selectCharacter()
        }
      })
      container.on('pointerover', () => {
        if (!this.isSelecting && index !== this.selectedCharacterIndex) {
          this.showHoverEffect(index)
        }
      })
      container.on('pointerout', () => {
        if (!this.isSelecting && index !== this.selectedCharacterIndex) {
          this.hideHoverEffect(index)
        }
      })
    })
  }

  showHoverEffect(index) {
    const border = this.characterBorders[index]
    const sprite = this.characterSprites[index]
    const nameText = this.characterNames[index]
    border.clear()
    border.lineStyle(4, 0xaaaaaa, 1)
    const x = this.characterContainers[index].x
    const y = this.characterContainers[index].y
    border.strokeRoundedRect(x - 110, y - 150, 220, 300, 10)
    const baseScale = Math.min(200 / sprite.width, 300 / sprite.height)
    sprite.setScale(baseScale * 1.05)
    sprite.setTint(0xf0f0f0)
    nameText.setFill('#f0f0f0')
  }

  hideHoverEffect(index) {
    const border = this.characterBorders[index]
    const sprite = this.characterSprites[index]
    const nameText = this.characterNames[index]
    border.clear()
    border.lineStyle(3, 0x666666, 0.8)
    const x = this.characterContainers[index].x
    const y = this.characterContainers[index].y
    border.strokeRoundedRect(x - 110, y - 150, 220, 300, 10)
    const baseScale = Math.min(200 / sprite.width, 300 / sprite.height)
    sprite.setScale(baseScale)
    sprite.clearTint()
    nameText.setFill('#ffffff')
  }

  playBackgroundMusic() {}

  update() {
    if (this.isSelecting) return
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.aKey)) {
      this.selectedCharacterIndex = (this.selectedCharacterIndex - 1 + this.characters.length) % this.characters.length
      this.updateSelection()
      this.playSelectSound()
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.dKey)) {
      this.selectedCharacterIndex = (this.selectedCharacterIndex + 1) % this.characters.length
      this.updateSelection()
      this.playSelectSound()
    }
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.selectCharacter()
    }
  }

  updateSelection() {
    this.selectionFrames.forEach(frame => frame.setVisible(false))
    this.selectionFrames[this.selectedCharacterIndex].setVisible(true)
    this.characterSprites.forEach((sprite, index) => {
      if (index !== this.selectedCharacterIndex) {
        this.hideHoverEffect(index)
      }
    })
    const selectedBorder = this.characterBorders[this.selectedCharacterIndex]
    selectedBorder.clear()
    selectedBorder.lineStyle(5, 0xffaa00, 1)
    const x = this.characterContainers[this.selectedCharacterIndex].x
    const y = this.characterContainers[this.selectedCharacterIndex].y
    selectedBorder.strokeRoundedRect(x - 110, y - 150, 220, 300, 10)
    const selectedSprite = this.characterSprites[this.selectedCharacterIndex]
    selectedSprite.setTint(0xffffaa)
    const baseScale = Math.min(200 / selectedSprite.width, 300 / selectedSprite.height)
    selectedSprite.setScale(baseScale * 1.1)
    this.characterNames.forEach((nameText, index) => {
      if (index === this.selectedCharacterIndex) {
        nameText.setFill('#ffff00')
        nameText.setShadow(0, 0, '#ffffff', 4)
      } else {
        nameText.setFill('#ffffff')
        nameText.setShadow(0, 0, '#000000', 0)
      }
    })
  }

  playSelectSound() {
    if (this.sound.get("ui_select_sound")) {
      this.sound.play("ui_select_sound", { volume: 0.3 })
    }
  }

  playConfirmSound() {
    if (this.sound.get("ui_confirm_sound")) {
      this.sound.play("ui_confirm_sound", { volume: 0.3 })
    }
  }

  selectCharacter() {
    if (this.isSelecting) return
    
    this.isSelecting = true
    this.playConfirmSound()
    const selectedCharacter = this.characters[this.selectedCharacterIndex]
    if (this.backgroundMusic) this.backgroundMusic.stop()
    this.registry.set('selectedCharacter', selectedCharacter.playerClass)
    const selectedSprite = this.characterSprites[this.selectedCharacterIndex]
    this.tweens.add({
      targets: selectedSprite,
      scaleX: selectedSprite.scaleX * 1.2,
      scaleY: selectedSprite.scaleY * 1.2,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.cameras.main.fadeOut(500, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start("Level1Scene")
        })
      }
    })
    const confirmText = this.add.text(screenSize.width.value / 2, screenSize.height.value - 150, 
      `${selectedCharacter.name} — Let's go`, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '28px',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.tweens.add({
      targets: confirmText,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 3
    })
  }
}
