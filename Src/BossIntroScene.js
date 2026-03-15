import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class BossIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossIntroScene' })
  }

  init(data) {
    this.levelSceneKey = data.levelSceneKey
    this.bossName = data.bossName || 'Boss'
    this.bossTitle = data.bossTitle || 'BOSS ENCOUNTER'
    this.dialogueLines = Array.isArray(data.dialogueLines) ? data.dialogueLines : []
    this.focusPoint = data.focusPoint || null
    this.roarSoundKey = data.roarSoundKey || 'ninja_hurt_sound'
    this.isEnding = false
    this.currentLineIndex = -1
  }

  create() {
    this.levelScene = this.scene.get(this.levelSceneKey)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.createOverlay()
    this.createTitle()
    this.createDialogue()
    this.createBossBarPreview()
    this.playCinematicCamera()
    this.playRoar()
    this.startSequence()
  }

  createOverlay() {
    const width = screenSize.width.value
    const height = screenSize.height.value

    this.blackOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
    this.blackOverlay.setDepth(10)

    this.warningFlash = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0)
    this.warningFlash.setDepth(11)

    this.skipHint = this.add.text(width - 24, 18, 'SPACE: SKIP', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '12px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(20)

    this.tweens.add({
      targets: this.blackOverlay,
      alpha: 0.67,
      duration: 320,
      ease: 'Sine.easeOut'
    })

    this.tweens.add({
      targets: this.warningFlash,
      alpha: 0.22,
      duration: 160,
      yoyo: true,
      repeat: 2
    })
  }

  createTitle() {
    const width = screenSize.width.value
    const height = screenSize.height.value

    this.titleText = this.add.text(width / 2, height * 0.34, this.bossTitle, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '50px',
      fill: '#ff4f4f',
      stroke: '#000000',
      strokeThickness: 7,
      align: 'center'
    }).setOrigin(0.5).setDepth(16).setAlpha(0)

    this.nameText = this.add.text(width / 2, height * 0.41, this.bossName.toUpperCase(), {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '20px',
      fill: '#ffd8d8',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(16).setAlpha(0)
  }

  createDialogue() {
    const width = screenSize.width.value
    const height = screenSize.height.value
    this.dialogueText = this.add.text(width / 2, height * 0.74, '', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: Math.floor(width * 0.76) }
    }).setOrigin(0.5).setDepth(18).setAlpha(0.95)
  }

  createBossBarPreview() {
    const width = screenSize.width.value
    const barWidth = Math.min(620, Math.floor(width * 0.62))
    const barY = 58

    this.bossBarContainer = this.add.container(width / 2, -50).setDepth(19).setAlpha(0)

    const panel = this.add.rectangle(0, 0, barWidth + 24, 44, 0x1a0000, 0.86)
    panel.setStrokeStyle(2, 0xff5a5a, 1)
    const bg = this.add.rectangle(0, 8, barWidth, 12, 0x320000, 1)
    const fill = this.add.rectangle(-(barWidth / 2), 8, barWidth, 10, 0xff3b3b, 1).setOrigin(0, 0.5)
    const label = this.add.text(0, -14, this.bossTitle, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '11px',
      fill: '#ffd6d6',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)

    this.bossBarContainer.add([panel, bg, fill, label])

    this.tweens.add({
      targets: this.bossBarContainer,
      y: barY,
      alpha: 1,
      duration: 420,
      ease: 'Back.easeOut'
    })
  }

  playCinematicCamera() {
    if (!this.levelScene || !this.levelScene.cameras || !this.levelScene.cameras.main) return
    const camera = this.levelScene.cameras.main
    const targetX = this.focusPoint ? this.focusPoint.x : camera.midPoint.x
    const targetY = this.focusPoint ? this.focusPoint.y : camera.midPoint.y

    camera.pan(targetX, targetY, 900, 'Sine.easeInOut')
    camera.zoomTo(1.18, 900, 'Sine.easeInOut')
    camera.shake(280, 0.006)
  }

  playRoar() {
    const sfx = this.cache.audio.exists(this.roarSoundKey) ? this.roarSoundKey : 'ui_confirm_sound'
    if (this.cache.audio.exists(sfx)) {
      this.sound.play(sfx, { volume: 0.42, rate: 0.9 })
    }
  }

  startSequence() {
    this.tweens.add({
      targets: [this.titleText, this.nameText],
      alpha: 1,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.levelScene && this.levelScene.cameras && this.levelScene.cameras.main) {
          this.levelScene.cameras.main.shake(220, 0.01)
        }
      }
    })

    this.advanceDialogue()
    this.dialogueTimer = this.time.addEvent({
      delay: 1400,
      callback: () => this.advanceDialogue(),
      loop: true
    })
  }

  advanceDialogue() {
    this.currentLineIndex += 1
    if (this.currentLineIndex >= this.dialogueLines.length) {
      this.endIntro()
      return
    }
    this.dialogueText.setText(this.dialogueLines[this.currentLineIndex])
    this.warningFlash.alpha = 0.14
    this.tweens.add({
      targets: this.warningFlash,
      alpha: 0,
      duration: 220
    })
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.endIntro()
    }
  }

  endIntro() {
    if (this.isEnding) return
    this.isEnding = true
    if (this.dialogueTimer) this.dialogueTimer.remove()

    this.cameras.main.fadeOut(260, 0, 0, 0)
    this.time.delayedCall(270, () => {
      if (this.levelScene && typeof this.levelScene.completeBossIntro === 'function') {
        this.levelScene.completeBossIntro()
      }
      this.scene.stop()
    })
  }
}
