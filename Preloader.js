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
    this.load.pack('assetPack', 'assets/asset-pack.json')
  }

  create() {
    this.scene.start("TitleScreen")
  }
}
