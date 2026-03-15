import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'
import { applyAudioSettings, loadSettings, toggleControlsHints, toggleMute } from './settings.js'

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
    applyAudioSettings(this)
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
      this.scene.stop("IntroStoryScene")
    } catch {
      console.log("Cleanup UI scenes completed")
    }
  }

  createBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.background = this.add.image(screenWidth / 2, screenHeight / 2, "select_background")
    this.background.setDisplaySize(screenWidth, screenHeight)

    // Cinematic overlays for cleaner readability.
    this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x061327, 0.32)
    this.add.rectangle(screenWidth / 2, 0, screenWidth, 170, 0x000000, 0.25).setOrigin(0.5, 0)
    this.add.rectangle(screenWidth / 2, screenHeight, screenWidth, 150, 0x000000, 0.3).setOrigin(0.5, 1)
  }

  createTitle() {
    const screenWidth = screenSize.width.value
    this.titleText = this.add.text(screenWidth / 2, 72, 'SELECT CHARACTER', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 14, 54) + 'px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    this.titleText.setShadow(0, 0, '#ffe066', 10)
    this.themeTagline = this.add.text(screenWidth / 2, 126, 'Choose your diver and save the sea world.', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 52, 15) + 'px',
      fill: '#aee6ff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
  }

  createCharacterDisplay() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.cardWidth = 285
    this.cardHeight = 410
    this.portraitMaxWidth = 172
    this.portraitMaxHeight = 222
    this.characters = [
      {
        name: "AQUAMAN",
        key: "sasuke_select",
        description: "Guardian of the Seas\nSaves sea creatures from extinction",
        playerClass: "SasukePlayer",
        portraitYOffset: 6,
        portraitScale: 1.02
      },
      {
        name: "NARUTO", 
        key: "naruto_select",
        description: "Nine-Tails Jinchuriki\nRasengan & Shadow Clone",
        playerClass: "NarutoPlayer",
        portraitYOffset: 10,
        portraitScale: 0.99
      },
      {
        name: "KAKASHI",
        key: "kakashi_select", 
        description: "The Copy Ninja\nChidori & Sharingan Master",
        playerClass: "KakashiPlayer",
        portraitYOffset: 8,
        portraitScale: 1.0
      }
    ]
    const characterY = screenHeight * 0.52
    const characterSpacing = screenWidth / 4
    const startX = screenWidth / 2 - characterSpacing
    this.characterSprites = []
    this.characterNames = []
    this.characterDescriptions = []
    this.selectionFrames = []
    this.characterBorders = []
    this.characterCardPanels = []
    this.characterContainers = []
    this.characters.forEach((character, index) => {
      const x = startX + (index * characterSpacing)

      const panel = this.add.graphics()
      panel.fillStyle(0x0f233e, 0.38)
      panel.fillRoundedRect(
        x - this.cardWidth / 2,
        characterY - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
      panel.lineStyle(2, 0x8da2b6, 0.65)
      panel.strokeRoundedRect(
        x - this.cardWidth / 2,
        characterY - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
      this.characterCardPanels.push(panel)

      const sprite = this.add.image(x, characterY, character.key)
      const scale = Math.min(this.portraitMaxWidth / sprite.width, this.portraitMaxHeight / sprite.height)
      sprite.baseScale = scale * (character.portraitScale || 1)
      sprite.setScale(sprite.baseScale)
      // Anchor portraits to their feet so full body stays visible inside the card.
      sprite.setOrigin(0.5, 1)
      sprite.setY(characterY + 88 + (character.portraitYOffset || 0))
      this.characterSprites.push(sprite)
      const border = this.add.graphics()
      this.characterBorders.push(border)
      const nameText = this.add.text(x, characterY + this.cardHeight / 2 - 88, character.name, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '24px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5, 0.5)
      this.characterNames.push(nameText)
      const descText = this.add.text(x, characterY + this.cardHeight / 2 - 62, character.description, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '12px',
        fill: '#d6e2ee',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: this.cardWidth - 30 }
      }).setOrigin(0.5, 0)
      this.characterDescriptions.push(descText)
      const frame = this.add.graphics()
      frame.lineStyle(4, 0xffff00, 1)
      frame.strokeRoundedRect(
        x - this.cardWidth / 2, 
        characterY - this.cardHeight / 2, 
        this.cardWidth, 
        this.cardHeight, 
        10
      )
      frame.setVisible(false)
      this.selectionFrames.push(frame)
      const container = this.add.zone(x, characterY, this.cardWidth, this.cardHeight)
      container.setInteractive()
      this.characterContainers.push(container)
      this.drawCardBorder(index, 0x666666, 3, 0.8)
    })
  }

  drawCardBorder(index, color, thickness, alpha = 1) {
    const border = this.characterBorders[index]
    const container = this.characterContainers[index]
    if (!border || !container) return
    const x = container.x
    const y = container.y
    border.clear()
    border.lineStyle(thickness, color, alpha)
    border.strokeRoundedRect(
      x - this.cardWidth / 2,
      y - this.cardHeight / 2,
      this.cardWidth,
      this.cardHeight,
      10
    )
  }

  createUI() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    const panelWidth = 680
    const panelHeight = 62
    const panelX = screenWidth / 2
    const panelY = screenHeight - 90

    const controlsPanel = this.add.graphics()
    controlsPanel.fillStyle(0x0b1626, 0.58)
    controlsPanel.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 10)
    controlsPanel.lineStyle(2, 0x91b4cf, 0.7)
    controlsPanel.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 10)

    const panelPadding = 26
    this.leftControlsText = this.add.text(panelX - panelWidth / 2 + panelPadding, panelY, 'A/D OR LEFT/RIGHT: SWITCH', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#f3f8ff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'left'
    }).setOrigin(0, 0.5)

    this.rightControlsText = this.add.text(panelX + panelWidth / 2 - panelPadding, panelY, 'ENTER/SPACE: CONFIRM', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#f3f8ff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'right'
    }).setOrigin(1, 0.5)
    this.tweens.add({
      targets: [this.leftControlsText, this.rightControlsText],
      alpha: 0.5,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    this.settingsText = this.add.text(screenWidth - 20, screenHeight - 20, '', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '12px',
      fill: '#d6ecff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 1)
    this.refreshSettingsText()
  }

  refreshSettingsText() {
    const settings = loadSettings()
    this.settingsText.setText(
      `M: ${settings.musicMuted ? 'Unmute' : 'Mute'} | H: ${settings.showControlsHints ? 'Hide Hints' : 'Show Hints'}`
    )
  }

  setupInputs() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
    this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H)
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
    const sprite = this.characterSprites[index]
    const nameText = this.characterNames[index]
    const descText = this.characterDescriptions[index]
    const panel = this.characterCardPanels[index]
    if (panel) {
      panel.clear()
      panel.fillStyle(0x163253, 0.45)
      panel.fillRoundedRect(
        this.characterContainers[index].x - this.cardWidth / 2,
        this.characterContainers[index].y - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
      panel.lineStyle(2, 0xd6e9ff, 0.8)
      panel.strokeRoundedRect(
        this.characterContainers[index].x - this.cardWidth / 2,
        this.characterContainers[index].y - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
    }
    this.drawCardBorder(index, 0xaaaaaa, 4, 1)
    sprite.setScale(sprite.baseScale * 1.05)
    sprite.setTint(0xf0f0f0)
    nameText.setFill('#f0f0f0')
    descText.setFill('#e4eef8')
  }

  hideHoverEffect(index) {
    const sprite = this.characterSprites[index]
    const nameText = this.characterNames[index]
    const descText = this.characterDescriptions[index]
    const panel = this.characterCardPanels[index]
    if (panel) {
      panel.clear()
      panel.fillStyle(0x0f233e, 0.38)
      panel.fillRoundedRect(
        this.characterContainers[index].x - this.cardWidth / 2,
        this.characterContainers[index].y - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
      panel.lineStyle(2, 0x8da2b6, 0.65)
      panel.strokeRoundedRect(
        this.characterContainers[index].x - this.cardWidth / 2,
        this.characterContainers[index].y - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
    }
    this.drawCardBorder(index, 0x666666, 3, 0.8)
    sprite.setScale(sprite.baseScale)
    sprite.clearTint()
    nameText.setFill('#ffffff')
    descText.setFill('#d6e2ee')
  }

  playBackgroundMusic() {
    this.backgroundMusic = this.sound.add("ninja_adventure_theme", {
      volume: 0.45,
      loop: true
    })
    this.backgroundMusic.play()
  }

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
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      toggleMute(this)
      this.refreshSettingsText()
    }
    if (Phaser.Input.Keyboard.JustDown(this.hKey)) {
      toggleControlsHints()
      this.refreshSettingsText()
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
    this.drawCardBorder(this.selectedCharacterIndex, 0xffaa00, 5, 1)
    const selectedSprite = this.characterSprites[this.selectedCharacterIndex]
    const selectedPanel = this.characterCardPanels[this.selectedCharacterIndex]
    if (selectedPanel) {
      selectedPanel.clear()
      selectedPanel.fillStyle(0x1b3550, 0.56)
      selectedPanel.fillRoundedRect(
        this.characterContainers[this.selectedCharacterIndex].x - this.cardWidth / 2,
        this.characterContainers[this.selectedCharacterIndex].y - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
      selectedPanel.lineStyle(2, 0xffe9a3, 0.9)
      selectedPanel.strokeRoundedRect(
        this.characterContainers[this.selectedCharacterIndex].x - this.cardWidth / 2,
        this.characterContainers[this.selectedCharacterIndex].y - this.cardHeight / 2,
        this.cardWidth,
        this.cardHeight,
        12
      )
    }
    selectedSprite.setTint(0xffffaa)
    selectedSprite.setScale(selectedSprite.baseScale * 1.1)
    this.characterNames.forEach((nameText, index) => {
      if (index === this.selectedCharacterIndex) {
        nameText.setFill('#ffff00')
        nameText.setShadow(0, 0, '#ffffff', 4)
      } else {
        nameText.setFill('#ffffff')
        nameText.setShadow(0, 0, '#000000', 0)
      }
    })
    this.characterDescriptions.forEach((descText, index) => {
      if (index === this.selectedCharacterIndex) {
        descText.setFill('#f3fbff')
      } else {
        descText.setFill('#d6e2ee')
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
    this.registry.set('currentLevelNumber', 1)
    this.registry.set('difficultyLabel', 'Normal')
    this.registry.set('seaCreaturesSaved', 0)
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
          this.scene.stop("Level2Scene")
          this.scene.stop("Level3Scene")
          this.scene.stop("Level4Scene")
          this.scene.stop("UIScene")
          this.scene.stop("PauseUIScene")
          this.scene.stop("VictoryUIScene")
          this.scene.stop("GameOverUIScene")
          this.scene.stop("GameCompleteUIScene")
          this.scene.start("IntroStoryScene")
        })
      }
    })
    const confirmText = this.add.text(screenSize.width.value / 2, screenSize.height.value - 150, 
      `${selectedCharacter.name} - Let's go`, {
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
