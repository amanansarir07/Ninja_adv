import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

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
    } catch (error) {
      console.log("Cleanup UI scenes completed")
    }
  }
  createBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    

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
  }

  createGameTitle() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    this.gameTitle = this.add.image(screenWidth / 2, screenHeight * 0.35, "ninja_game_title")
    
    const maxTitleWidth = screenWidth * 0.7
    const maxTitleHeight = screenHeight * 0.6

    if (this.gameTitle.width / this.gameTitle.height > maxTitleWidth / maxTitleHeight) {
        this.gameTitle.setScale(maxTitleWidth / this.gameTitle.width)
    } else {
        this.gameTitle.setScale(maxTitleHeight / this.gameTitle.height)
    }
    this.gameTitle.y = 50 + this.gameTitle.displayHeight / 2

    this.tagline = this.add.text(screenWidth / 2, this.gameTitle.y + this.gameTitle.displayHeight / 2 + 28, "Save the sea before it's too late.", {
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
  setupInputs()
   {
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.input.on('pointerdown', () => this.startGame())
    this.input.keyboard.on('keydown', (event) => {
      if (event.code === 'Enter' || event.code === 'Space') this.startGame()
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