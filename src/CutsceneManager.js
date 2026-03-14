import Phaser from 'phaser'

export class CutsceneManager {
  constructor(scene, config) {
    this.scene = scene
    this.dialogueTextObject = config.dialogueTextObject
    this.onComplete = config.onComplete
    this.charDelay = config.charDelay ?? 26
    this.lineHoldDelay = config.lineHoldDelay ?? 220
    this.autoAdvanceDelay = config.autoAdvanceDelay ?? 0
    this.lines = []
    this.currentLineIndex = 0
    this.isTyping = false
    this.visibleLength = 0
    this.currentLine = ''
    this.typeTimer = null
    this.isTransitioning = false
    this.autoAdvanceTimer = null
    this.skipHintTextObject = config.skipHintTextObject || null
    this.onLineStart = config.onLineStart || null
    this.onTypeChar = config.onTypeChar || null
    this.onTypingStateChange = config.onTypingStateChange || null
  }

  start(lines) {
    this.lines = lines
    this.currentLineIndex = 0
    this.showCurrentLine()
  }

  showCurrentLine() {
    if (this.currentLineIndex >= this.lines.length) {
      this.completeCutscene()
      return
    }

    this.currentLine = this.lines[this.currentLineIndex]
    if (this.onLineStart) {
      this.onLineStart(this.currentLineIndex, this.lines.length, this.currentLine)
    }
    this.visibleLength = 0
    this.isTyping = true
    if (this.onTypingStateChange) {
      this.onTypingStateChange(true)
    }
    this.dialogueTextObject.setText('')

    if (this.typeTimer) {
      this.typeTimer.remove(false)
    }
    this.clearAutoAdvanceTimer()

    this.typeTimer = this.scene.time.addEvent({
      delay: this.charDelay,
      loop: true,
      callback: () => {
        this.visibleLength += 1
        this.dialogueTextObject.setText(this.currentLine.slice(0, this.visibleLength))
        if (this.onTypeChar) {
          this.onTypeChar(this.visibleLength, this.currentLine.length)
        }
        if (this.visibleLength >= this.currentLine.length) {
          this.isTyping = false
          if (this.onTypingStateChange) {
            this.onTypingStateChange(false)
          }
          this.typeTimer.remove(false)
          this.typeTimer = null
          this.scheduleAutoAdvance()
        }
      }
    })
  }

  scheduleAutoAdvance() {
    this.clearAutoAdvanceTimer()
    if (this.autoAdvanceDelay <= 0 || this.isTransitioning) return
    this.autoAdvanceTimer = this.scene.time.delayedCall(this.autoAdvanceDelay, () => {
      if (this.isTransitioning || this.isTyping) return
      this.advanceToNextLine()
    })
  }

  clearAutoAdvanceTimer() {
    if (!this.autoAdvanceTimer) return
    this.autoAdvanceTimer.remove(false)
    this.autoAdvanceTimer = null
  }

  advanceToNextLine() {
    if (this.isTransitioning) return
    this.currentLineIndex += 1
    this.scene.time.delayedCall(this.lineHoldDelay, () => this.showCurrentLine())
  }

  nextLine() {
    if (this.isTransitioning) return
    this.clearAutoAdvanceTimer()

    if (this.isTyping) {
      this.isTyping = false
      if (this.onTypingStateChange) {
        this.onTypingStateChange(false)
      }
      if (this.typeTimer) {
        this.typeTimer.remove(false)
        this.typeTimer = null
      }
      this.dialogueTextObject.setText(this.currentLine)
      this.scheduleAutoAdvance()
      return
    }

    this.advanceToNextLine()
  }

  skip() {
    if (this.isTransitioning) return
    this.clearAutoAdvanceTimer()
    this.isTyping = false
    if (this.onTypingStateChange) {
      this.onTypingStateChange(false)
    }
    if (this.typeTimer) {
      this.typeTimer.remove(false)
      this.typeTimer = null
    }
    this.completeCutscene()
  }

  completeCutscene() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.clearAutoAdvanceTimer()

    if (this.skipHintTextObject) {
      this.skipHintTextObject.setText('Diving to Village Depths...')
    }

    this.scene.cameras.main.fadeOut(700, 0, 0, 0)
    this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.onComplete()
    })
  }
}
