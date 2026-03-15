import Phaser from 'phaser'
import { setupLoadingProgressUI } from './utils.js'

export class Preloader extends Phaser.Scene {
  constructor() {
    super({
      key: "Preloader",
    })
  }

  preload() {
    setupLoadingProgressUI(this)
    this.isBooted = false

    this.statusText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 0.62, 'Loading assets... 0%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5)

    this.load.on('progress', (value) => {
      if (this.statusText && this.statusText.active) {
        const pct = Math.round(value * 100)
        this.statusText.setText(`Loading assets... ${pct}%`)
      }
    })

    this.load.on('loaderror', (fileObj) => {
      console.warn('Asset failed to load:', fileObj && fileObj.key, fileObj && fileObj.src)
    })

    // Avoid infinite black screen if a CDN request hangs.
    this.bootFallbackTimer = this.time.delayedCall(20000, () => {
      if (!this.isBooted) {
        console.warn('Preloader timeout reached. Continuing to TitleScreen.')
        this.startTitle()
      }
    })

    this.load.pack('assetPack', 'assets/asset-pack.json')
  }

  create() {
    this.startTitle()
  }

  startTitle() {
    if (this.isBooted) return
    this.isBooted = true
    if (this.bootFallbackTimer) this.bootFallbackTimer.remove()
    if (this.statusText && this.statusText.active) this.statusText.destroy()
    this.scene.start("TitleScreen")
  }
}
