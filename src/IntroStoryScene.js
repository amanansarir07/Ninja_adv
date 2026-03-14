import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'
import { applyAudioSettings } from './settings.js'
import { CutsceneManager } from './CutsceneManager.js'

const STORY_LINES = [
  'The ocean was once full of life. Now it is collapsing.',
  'The ABYSS ORDER built secret laboratories deep underwater.',
  'Their machines drain ocean energy and poison marine life.',
  'Fish are disappearing. Coral reefs are dying.',
  'Enemy ninjas protect these experiments in every depth.',
  'Your mission: clear Village Depths, Ruins Depths, and Temple Depths.',
  'Then invade the Fire Fortress and destroy the final core.',
  'Save the ocean before the ecosystem is lost forever.'
]

export class IntroStoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroStoryScene' })
    this.cameraDriftTime = 0
  }

  create() {
    applyAudioSettings(this)
    this.stopOtherScenes()
    this.setupLayoutMetrics()

    this.createParallaxBackground()
    this.createBubbleField()
    this.createCameraDrift()
    this.createCinematicOverlay()
    this.createBossSilhouettes()
    this.createTopHud()
    this.createDialoguePanel()
    this.createCharacterPortrait()
    this.bindInputs()
    this.playAmbientMusic()
    this.setupTypingSfx()

    this.cutsceneManager = new CutsceneManager(this, {
      dialogueTextObject: this.dialogueText,
      skipHintTextObject: this.controlsHintText,
      onLineStart: (lineIndex, totalLines) => this.updateDialogueProgress(lineIndex, totalLines),
      onTypeChar: (visibleLength, lineLength) => this.playTypingSfx(visibleLength, lineLength),
      onTypingStateChange: (isTyping) => this.setTypingState(isTyping),
      onComplete: () => this.finishAndStartLevel(),
      charDelay: 16,
      autoAdvanceDelay: 6000
    })

    this.cameras.main.fadeIn(700, 0, 0, 0)
    this.cutsceneManager.start(STORY_LINES)
  }

  pinToCamera(gameObject) {
    if (gameObject && gameObject.setScrollFactor) {
      gameObject.setScrollFactor(0)
    }
    return gameObject
  }

  setupLayoutMetrics() {
    const width = screenSize.width.value
    const height = screenSize.height.value

    this.layout = {
      width,
      height,
      safeMargin: Math.max(20, Math.floor(width * 0.03)),
      panelWidth: Math.min(1160, width - 72),
      panelHeight: Math.min(280, Math.max(220, Math.floor(height * 0.28))),
      panelBottom: Math.max(18, Math.floor(height * 0.03)),
      portraitColumnWidth: Math.min(250, Math.max(172, Math.floor(width * 0.16))),
      dialogueFontSize: width < 1100 ? 22 : 26
    }
  }

  stopOtherScenes() {
    this.scene.stop('UIScene')
    this.scene.stop('PauseUIScene')
    this.scene.stop('VictoryUIScene')
    this.scene.stop('GameOverUIScene')
    this.scene.stop('GameCompleteUIScene')
    this.scene.stop('Level1Scene')
    this.scene.stop('Level2Scene')
    this.scene.stop('Level3Scene')
    this.scene.stop('Level4Scene')
  }

  createParallaxBackground() {
    const { width, height } = this.layout
    this.bgContainer = this.add.container(0, 0)
    this.bgContainer.setDepth(0)

    const layerConfig = [
      { key: 'konoha_village_background', alpha: 0.33, scrollFactor: 0.08, yOffset: 0 },
      { key: 'desert_ruins_background', alpha: 0.2, scrollFactor: 0.12, yOffset: 12 },
      { key: 'thunder_temple_background', alpha: 0.17, scrollFactor: 0.16, yOffset: -8 },
      { key: 'fire_fortress_background', alpha: 0.13, scrollFactor: 0.21, yOffset: 5 }
    ]

    this.parallaxLayers = []
    layerConfig.forEach((layer) => {
      if (!this.textures.exists(layer.key)) return
      const image = this.add.image(width / 2, height / 2 + layer.yOffset, layer.key)
      const scale = Math.max(width / image.width, height / image.height)
      image.setScale(scale)
      image.setAlpha(layer.alpha)
      image.setTint(0x72d2d0)
      image.parallaxFactor = layer.scrollFactor
      this.bgContainer.add(image)
      this.parallaxLayers.push(image)
    })

    if (this.parallaxLayers.length === 0) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x0c1f3a, 1).setDepth(0)
    }
  }

  createBubbleField() {
    const { width, height } = this.layout
    this.bubbles = []

    for (let i = 0; i < 28; i += 1) {
      const radius = Phaser.Math.Between(2, 8)
      const bubble = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        radius,
        Phaser.Utils.Array.GetRandom([0x8be8ff, 0xc7fbff, 0xa9ebff]),
        Phaser.Math.FloatBetween(0.28, 0.62)
      )
      bubble.setDepth(12)
      bubble.riseSpeed = Phaser.Math.FloatBetween(0.18, 0.72)
      bubble.waveOffset = Phaser.Math.FloatBetween(0, Math.PI * 2)
      bubble.baseX = bubble.x
      this.bubbles.push(bubble)
    }
  }

  createCameraDrift() {
    this.cameras.main.setScroll(0, 0)
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: 24,
      scrollY: 16,
      duration: 9000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  createCinematicOverlay() {
    const { width, height } = this.layout
    this.pinToCamera(this.add.rectangle(width / 2, height / 2, width, height, 0x021c2f, 0.4).setDepth(20))
    this.pinToCamera(this.add.rectangle(width / 2, 0, width, 112, 0x000000, 0.6).setOrigin(0.5, 0).setDepth(21))
    this.pinToCamera(this.add.rectangle(width / 2, height, width, 128, 0x000000, 0.68).setOrigin(0.5, 1).setDepth(21))
  }

  createBossSilhouettes() {
    const { width, height } = this.layout
    this.leftSilhouette = this.add.ellipse(width * 0.82, height * 0.42, 140, 210, 0x000000, 0.28).setDepth(30)
    this.rightSilhouette = this.add.ellipse(width * 0.9, height * 0.45, 120, 184, 0x000000, 0.24).setDepth(30)
    this.tweens.add({
      targets: [this.leftSilhouette, this.rightSilhouette],
      alpha: { from: 0.1, to: 0.31 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  createTopHud() {
    const { width, safeMargin } = this.layout
    const hudY = safeMargin + 8
    const boxHeight = 42
    const boxPaddingX = 24

    const chapterText = this.pinToCamera(this.add.text(0, hudY + 16, 'CHAPTER 01: DESCENT', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#c7f4ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5).setDepth(111))
    const chapterWidth = chapterText.width + boxPaddingX * 2
    const chapterX = safeMargin + chapterWidth / 2
    this.pinToCamera(this.add.rectangle(chapterX, hudY + 16, chapterWidth, boxHeight, 0x021826, 0.8)
      .setStrokeStyle(2, 0x58d0ff, 0.85)
      .setDepth(110))
    chapterText.setX(chapterX - chapterWidth / 2 + boxPaddingX)

    this.controlsHintText = this.pinToCamera(this.add.text(0, hudY + 16, 'SPACE: Next   |   ENTER/ESC: Skip', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '14px',
      fill: '#d7f5ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5).setDepth(111))
    const controlsWidth = this.controlsHintText.width + boxPaddingX * 2
    const controlsX = width - safeMargin - controlsWidth / 2
    this.pinToCamera(this.add.rectangle(controlsX, hudY + 16, controlsWidth, boxHeight, 0x021826, 0.8)
      .setStrokeStyle(2, 0x58d0ff, 0.85)
      .setDepth(110))
    this.controlsHintText.setX(controlsX - controlsWidth / 2 + boxPaddingX)
  }

  createDialoguePanel() {
    const { width, height, panelWidth, panelHeight, panelBottom, portraitColumnWidth, dialogueFontSize } = this.layout
    const panelX = width / 2
    const panelY = height - panelBottom - panelHeight / 2
    const panelLeft = panelX - panelWidth / 2
    const panelTop = panelY - panelHeight / 2
    const panelPadding = 20

    const panelGlow = this.pinToCamera(this.add.graphics().setDepth(94))
    panelGlow.fillStyle(0x2ca4d8, 0.18)
    panelGlow.fillRoundedRect(panelLeft - 6, panelTop - 6, panelWidth + 12, panelHeight + 12, 14)

    const panelBase = this.pinToCamera(this.add.graphics().setDepth(95))
    panelBase.fillStyle(0x031a2f, 0.87)
    panelBase.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 12)
    panelBase.lineStyle(2, 0x5fd9ff, 0.95)
    panelBase.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 12)

    const dividerX = panelLeft + portraitColumnWidth + panelPadding
    const divider = this.pinToCamera(this.add.graphics().setDepth(98))
    divider.lineStyle(2, 0x2f89b6, 0.6)
    divider.lineBetween(dividerX, panelTop + 12, dividerX, panelTop + panelHeight - 12)

    this.dialogueTitle = this.pinToCamera(this.add.text(dividerX + panelPadding, panelTop + 18, 'MISSION BRIEFING', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '18px',
      fill: '#9de8ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(100))

    const totalLinesLabel = String(STORY_LINES.length).padStart(2, '0')
    this.lineCounter = this.pinToCamera(this.add.text(panelX + panelWidth / 2 - panelPadding, panelTop + 18, `01 / ${totalLinesLabel}`, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#b9e9ff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(100))

    this.progressTrack = this.pinToCamera(this.add.rectangle(
      dividerX + panelPadding,
      panelTop + 54,
      panelWidth - portraitColumnWidth - panelPadding * 3,
      8,
      0x0a2d45,
      0.92
    ).setOrigin(0, 0.5).setDepth(100))

    this.progressFill = this.pinToCamera(this.add.rectangle(
      dividerX + panelPadding + 2,
      panelTop + 54,
      1,
      4,
      0x61dcff,
      1
    ).setOrigin(0, 0.5).setDepth(101))

    this.dialogueText = this.pinToCamera(this.add.text(dividerX + panelPadding, panelTop + 84, '', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: `${dialogueFontSize}px`,
      fill: '#ebfaff',
      stroke: '#001019',
      strokeThickness: 4,
      lineSpacing: 8,
      wordWrap: { width: panelWidth - portraitColumnWidth - panelPadding * 3 }
    }).setDepth(101))

    this.continueHint = this.pinToCamera(this.add.text(panelX + panelWidth / 2 - panelPadding, panelTop + panelHeight - 18, 'SPACE TO CONTINUE', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '14px',
      fill: '#8fddff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 1).setDepth(101).setAlpha(0))
  }

  createCharacterPortrait() {
    const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
    const keyMap = {
      SasukePlayer: 'sasuke_select',
      NarutoPlayer: 'naruto_select',
      KakashiPlayer: 'kakashi_select'
    }
    const nameMap = {
      SasukePlayer: 'AQUAMAN',
      NarutoPlayer: 'NARUTO',
      KakashiPlayer: 'KAKASHI'
    }
    const portraitKey = keyMap[selectedCharacter] || 'kakashi_select'
    if (!this.textures.exists(portraitKey)) return

    const { width, height, panelWidth, panelHeight, panelBottom, portraitColumnWidth } = this.layout
    const panelLeft = width / 2 - panelWidth / 2
    const panelTop = height - panelBottom - panelHeight
    const portraitCenterX = panelLeft + portraitColumnWidth / 2 + 10
    const portraitBottomY = panelTop + panelHeight - 16

    this.portraitPanel = this.pinToCamera(this.add.rectangle(
      portraitCenterX,
      panelTop + panelHeight / 2,
      portraitColumnWidth - 24,
      panelHeight - 24,
      0x031625,
      0.92
    ).setStrokeStyle(2, 0x4bbbe8, 0.86).setDepth(99))

    this.portrait = this.pinToCamera(this.add.image(portraitCenterX, portraitBottomY, portraitKey).setOrigin(0.5, 1).setDepth(100))
    const portraitScale = Math.min((portraitColumnWidth - 60) / this.portrait.width, (panelHeight - 84) / this.portrait.height)
    this.portrait.setScale(portraitScale)
    this.portrait.setTint(0xd7f6ff)

    this.portraitName = this.pinToCamera(this.add.text(portraitCenterX, panelTop + 12, nameMap[selectedCharacter] || 'WARRIOR', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '15px',
      fill: '#b6eeff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0).setDepth(101))
  }

  updateDialogueProgress(lineIndex, totalLines) {
    const current = Phaser.Math.Clamp(lineIndex + 1, 1, totalLines)
    const pad = (value) => String(value).padStart(2, '0')
    if (this.lineCounter) {
      this.lineCounter.setText(`${pad(current)} / ${pad(totalLines)}`)
    }
    if (this.progressFill && this.progressTrack) {
      const trackWidth = this.progressTrack.width - 4
      const fillWidth = Math.max(2, (current / totalLines) * trackWidth)
      this.progressFill.width = fillWidth
    }
  }

  bindInputs() {
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
  }

  playAmbientMusic() {
    if (!this.cache.audio.exists('ninja_adventure_theme')) return
    this.ambientMusic = this.sound.add('ninja_adventure_theme', {
      volume: 0.22,
      loop: true
    })
    this.ambientMusic.play()
  }

  setupTypingSfx() {
    this.isTypingActive = false
    this.nextTypeSfxAt = 0
  }

  setTypingState(isTyping) {
    this.isTypingActive = isTyping
  }

  playTypingSfx(visibleLength, lineLength) {
    if (!this.isTypingActive) return
    if (!this.cache.audio.exists('ui_select_sound')) return
    if (this.time.now < this.nextTypeSfxAt) return
    if (visibleLength % 4 !== 0 && visibleLength !== lineLength) return

    this.nextTypeSfxAt = this.time.now + 55
    this.sound.play('ui_select_sound', {
      volume: 0.05,
      rate: 1.22
    })
  }

  finishAndStartLevel() {
    if (this.ambientMusic) this.ambientMusic.stop()
    this.scene.start('Level1Scene')
  }

  update(time) {
    if (!this.cutsceneManager || this.cutsceneManager.isTransitioning) return

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.cutsceneManager.nextLine()
    }
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cutsceneManager.skip()
    }

    const shouldShowContinue = !this.cutsceneManager.isTyping
    this.continueHint.setAlpha(shouldShowContinue ? 0.92 : 0.0)
    if (shouldShowContinue) {
      this.continueHint.alpha = 0.65 + Math.sin(time * 0.01) * 0.27
    }

    this.cameraDriftTime = time * 0.001
    this.bubbles.forEach((bubble) => {
      bubble.y -= bubble.riseSpeed
      bubble.x = bubble.baseX + Math.sin(this.cameraDriftTime + bubble.waveOffset) * 10
      if (bubble.y < -16) {
        bubble.y = this.layout.height + Phaser.Math.Between(10, 40)
        bubble.baseX = Phaser.Math.Between(0, this.layout.width)
      }
    })

    const camX = this.cameras.main.scrollX
    const camY = this.cameras.main.scrollY
    this.parallaxLayers.forEach((layer) => {
      layer.x = this.layout.width / 2 + camX * layer.parallaxFactor
      layer.y = this.layout.height / 2 + camY * layer.parallaxFactor
    })
  }
}
