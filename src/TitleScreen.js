import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'
import { applyAudioSettings, toggleControlsHints, toggleMute, loadSettings } from './settings.js'

export class TitleScreen extends Phaser.Scene {
  constructor() {
    super({
      key: "TitleScreen",
    })
    this.isStarting = false
  }

  init()
   {
    this.isStarting = false
  }
  create() 
  {
    this.settings = applyAudioSettings(this)
    this.cleanupUIScenes()
    
    this.createBackground()

    this.createCharacters()

    this.createUI()
    this.setupInputs()
    this.playBackgroundMusic()
  }

  cleanupUIScenes()
   {
    try {
      this.scene.stop("UIScene")
      this.scene.stop("PauseUIScene")
      this.scene.stop("VictoryUIScene")
      this.scene.stop("GameOverUIScene")
      this.scene.stop("GameCompleteUIScene")
      this.scene.stop("Level1Scene")
      this.scene.stop("Level2Scene")
      this.scene.stop("Level3Scene")
      this.scene.stop("Level4Scene")
      this.scene.stop("CharacterSelectScene")
      this.scene.stop("IntroStoryScene")
    } catch {
      console.log("Cleanup UI scenes completed")
    }
  }
  createBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    if (!this.textures.exists("clean_background")) {
      this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 1)
      return
    }

    const bgImage = this.add.image(0, 0, "clean_background").setOrigin(0, 0)
    const bgScaleX = screenWidth / bgImage.width
    const bgScaleY = screenHeight / bgImage.height
    const bgScale = Math.max(bgScaleX, bgScaleY)
    bgImage.setScale(bgScale)
    bgImage.x = (screenWidth - bgImage.width * bgScale) / 2
    bgImage.y = (screenHeight - bgImage.height * bgScale) / 2
  }
  createCharacters() 
  {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    if (!this.textures.exists("naruto_pose") || !this.textures.exists("sasuke_pose")) {
      return
    }
    this.narutoSprite = this.add.image(screenWidth * 0.8, screenHeight * 0.7, "naruto_pose")
    const narutoScale = (screenHeight * 0.35) / this.narutoSprite.height 
    this.narutoSprite.setScale(narutoScale)
    this.narutoSprite.setFlipX(true) 
    this.narutoSprite.setOrigin(0.5, 1) 
    this.sasukeSprite = this.add.image(screenWidth * 0.2, screenHeight * 0.7, "sasuke_pose")
    const sasukeScale = (screenHeight * 0.35) / this.sasukeSprite.height 
    this.sasukeSprite.setScale(sasukeScale)
    this.sasukeSprite.setOrigin(0.5, 1) 
    this.tweens.add({
      targets: this.narutoSprite,
      scaleX: narutoScale * 1.02,
      scaleY: narutoScale * 1.02,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    this.tweens.add({
      targets: this.sasukeSprite,
      scaleX: sasukeScale * 1.02,
      scaleY: sasukeScale * 1.02,
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  createUI() {
    this.createGameTitle()
    this.createPressEnterText()
    this.createSettingsHint()
  }

  createGameTitle() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    let taglineY = screenHeight * 0.32
    if (this.textures.exists("ninja_game_title")) {
      this.gameTitle = this.add.image(screenWidth / 2, screenHeight * 0.35, "ninja_game_title")
      const maxTitleWidth = screenWidth * 0.7
      const maxTitleHeight = screenHeight * 0.6

      if (this.gameTitle.width / this.gameTitle.height > maxTitleWidth / maxTitleHeight) {
          this.gameTitle.setScale(maxTitleWidth / this.gameTitle.width)
      } else {
          this.gameTitle.setScale(maxTitleHeight / this.gameTitle.height)
      }
      this.gameTitle.y = 50 + this.gameTitle.displayHeight / 2
      taglineY = this.gameTitle.y + this.gameTitle.displayHeight / 2 + 28
    } else {
      this.add.text(screenWidth / 2, screenHeight * 0.25, 'NINJA ADVENTURE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: Math.min(screenWidth / 14, 64) + 'px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5, 0.5)
    }

    this.tagline = this.add.text(screenWidth / 2, taglineY, "Save the sea before it's too late.", {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 38, 16) + 'px',
      fill: '#87ceeb',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5, 0.5)
  }

  createPressEnterText() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.pressEnterText = this.add.text(screenWidth / 2, screenHeight * 0.75, 'PRESS ENTER TO START', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 20, 48) + 'px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    
    this.pressEnterText.y = screenHeight - 80 - this.pressEnterText.displayHeight / 2
   
    this.tweens.add({
      targets: this.pressEnterText,
      alpha: 0.3,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    

  }

  createSettingsHint() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.settingsText = this.add.text(screenWidth - 20, screenHeight - 14, '', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '13px',
      fill: '#d6ecff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 1)
    this.refreshSettingsHint()
  }

  refreshSettingsHint() {
    const settings = loadSettings()
    this.settingsText.setText(
      `M: ${settings.musicMuted ? 'Unmute' : 'Mute'}  |  H: ${settings.showControlsHints ? 'Hide Hints' : 'Show Hints'}`
    )
  }
  setupInputs()
   {
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.input.on('pointerdown', () => this.startGame())
    this.input.keyboard.on('keydown', (event) => {
      if (event.code === 'Enter' || event.code === 'Space') this.startGame()
      if (event.code === 'KeyM') {
        toggleMute(this)
        this.refreshSettingsHint()
      }
      if (event.code === 'KeyH') {
        toggleControlsHints()
        this.refreshSettingsHint()
      }
    })
  }

  playBackgroundMusic() {
    this.backgroundMusic = this.sound.add("ninja_adventure_theme", {
      volume: 0.6,
      loop: true
    })
    this.backgroundMusic.play()
  }

  startGame() {
    if (this.isStarting) return
    this.isStarting = true
    // Always start a fresh run from level 1 after character selection.
    this.registry.set('currentLevelNumber', 1)
    this.registry.set('difficultyLabel', 'Normal')
    this.registry.set('seaCreaturesSaved', 0)
    this.sound.play("ui_click_sound", { volume: 0.3 })
    if (this.backgroundMusic) this.backgroundMusic.stop()
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("CharacterSelectScene")
    })
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startGame()
    }
  }
}
