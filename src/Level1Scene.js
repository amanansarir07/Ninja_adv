import { BaseLevelScene } from './BaseLevelScene.js'
import { KakashiPlayer } from './KakashiPlayer.js'
import { SasukePlayer } from './SasukePlayer.js'
import { NarutoPlayer } from './NarutoPlayer.js'
import { SoundNinja } from './SoundNinja.js'

export class Level1Scene extends BaseLevelScene {
  constructor() {
    super({
      key: "Level1Scene",
    })
  }

  create() {
    try {
      console.log('Level1Scene create started')
      this.isInitialized = false
      this.createBaseElementsAsync().then(() => {
        this.backgroundMusic = this.sound.add("ninja_adventure_theme", {
          volume: 0.6,
          loop: true
        })
        this.backgroundMusic.play()
        this.isInitialized = true
        console.log('Level1Scene create completed')
      }).catch(error => {
        console.error('Error in Level1Scene create:', error)
        this.isInitialized = true
      })
    } catch (error) {
      console.error('Synchronous error in Level1Scene create:', error)
      this.isInitialized = true
    }
  }

  async createBaseElementsAsync() {
    await this.createBaseElements()
  }

  update() {
    if (!this.isInitialized) return
    this.baseUpdate()
  }

  setupMapSize() {
    this.mapWidth = 30 * 64
    this.mapHeight = 20 * 64
  }

  async createPlayer() {
    const playerX = 3 * 64
    const playerY = 17 * 64
    const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
    this.player = await this.createPlayerByType(selectedCharacter, playerX, playerY)
    
    console.log('Player created:', this.player)
  }

  createEnemies() {
    const enemy1 = new SoundNinja(this, 15 * 64, 18 * 64)
    this.enemies.add(enemy1)
    const enemy2 = new SoundNinja(this, 25 * 64, 15 * 64)
    this.enemies.add(enemy2)
    const enemy3 = new SoundNinja(this, 15 * 64, 14 * 64)
    this.enemies.add(enemy3)
  }

  createBackground() {
    let backgroundKey = "konoha_village_background"
    
    if (!this.textures.exists(backgroundKey)) {
      console.warn(`Background ${backgroundKey} not found, using default forest_background`)
      backgroundKey = "forest_background"
    }
    
    const bgImage = this.add.image(0, 0, backgroundKey).setOrigin(0, 0)
    const bgScale = this.mapHeight / bgImage.height
    bgImage.setScale(bgScale)

    const scaledBgWidth = bgImage.width * bgScale
    const numRepeats = Math.ceil(this.mapWidth / scaledBgWidth)
    for (let i = 0; i < numRepeats; i++) {
      const bg = this.add.image(i * scaledBgWidth, 0, backgroundKey)
        .setOrigin(0, 0)
        .setScale(bgScale)
        .setScrollFactor(0.2)
    }
  }

  createTileMap() {
    this.map = this.make.tilemap({ key: "level1_map" })
    this.forestGroundTileset = this.map.addTilesetImage("forest_ground", "forest_ground")
    this.groundLayer = this.map.createLayer("ground", this.forestGroundTileset, 0, 0)
    this.groundLayer.setCollisionByExclusion([-1])
  }

  createDecorations() {
    const tree1 = this.add.image(2 * 64, 17 * 64, "trees_variant_1")
    tree1.setOrigin(0.5, 1)
    tree1.setScale(0.6)
    this.decorations.add(tree1)
    
    const bush1 = this.add.image(6 * 64, 17.5 * 64, "bushes_variant_1")
    bush1.setOrigin(0.5, 1)
    bush1.setScale(0.4)
    this.decorations.add(bush1)
    const tree2 = this.add.image(11 * 64, 18.8 * 64, "trees_variant_2")
    tree2.setOrigin(0.5, 1)
    tree2.setScale(0.6)
    this.decorations.add(tree2)
    
    const rock1 = this.add.image(19 * 64, 19.2 * 64, "rocks_variant_1")
    rock1.setOrigin(0.5, 1)
    rock1.setScale(0.5)
    this.decorations.add(rock1)
    const tree3 = this.add.image(23 * 64, 15.5 * 64, "trees_variant_3")
    tree3.setOrigin(0.5, 1)
    tree3.setScale(0.6)
    this.decorations.add(tree3)
    
    const woodenPost = this.add.image(27 * 64, 15.5 * 64, "wooden_post_variant_1")
    woodenPost.setOrigin(0.5, 1)
    woodenPost.setScale(0.3)
    this.decorations.add(woodenPost)
    const grass1 = this.add.image(10 * 64, 12.8 * 64, "grass_variant_1")
    grass1.setOrigin(0.5, 1)
    grass1.setScale(0.3)
    this.decorations.add(grass1)
    
    const bush2 = this.add.image(16 * 64, 14.8 * 64, "bushes_variant_2")
    bush2.setOrigin(0.5, 1)
    bush2.setScale(0.4)
    this.decorations.add(bush2)
    
    this.createEnvironmentalStoryElements()
  }

  createEnvironmentalStoryElements() {
    const debrisColors = [0x8b7355, 0x696969, 0x4a4a4a]
    
    const crate1 = this.add.graphics()
    crate1.fillStyle(0x8b4513, 0.7)
    crate1.fillRect(-20, -15, 40, 30)
    crate1.lineStyle(2, 0x5c3317, 0.8)
    crate1.strokeRect(-20, -15, 40, 30)
    crate1.setPosition(8 * 64, 18 * 64)
    crate1.setDepth(50)
    crate1.setRotation(0.15)
    this.decorations.add(crate1)
    
    const barrel = this.add.graphics()
    barrel.fillStyle(0x654321, 0.6)
    barrel.fillEllipse(0, 0, 30, 40)
    barrel.lineStyle(2, 0x3d2817, 0.7)
    barrel.strokeEllipse(0, 0, 30, 40)
    barrel.setPosition(20 * 64, 19 * 64)
    barrel.setDepth(50)
    barrel.setRotation(-0.3)
    this.decorations.add(barrel)
    
    const anchorGraphics = this.add.graphics()
    anchorGraphics.fillStyle(0x4a4a4a, 0.6)
    anchorGraphics.fillRect(-3, -30, 6, 50)
    anchorGraphics.fillCircle(0, -30, 8)
    anchorGraphics.fillRect(-25, 15, 50, 6)
    anchorGraphics.setPosition(5 * 64, 18 * 64)
    anchorGraphics.setDepth(48)
    this.decorations.add(anchorGraphics)
    
    const shell1 = this.add.graphics()
    shell1.fillStyle(0xffdab9, 0.5)
    shell1.fillCircle(0, 0, 12)
    shell1.fillStyle(0xffe4c4, 0.6)
    shell1.fillCircle(-3, -3, 5)
    shell1.setPosition(13 * 64, 18.5 * 64)
    shell1.setDepth(45)
    this.decorations.add(shell1)
    
    const shell2 = this.add.graphics()
    shell2.fillStyle(0xf0e68c, 0.5)
    shell2.fillEllipse(0, 0, 18, 12)
    shell2.setPosition(22 * 64, 15.3 * 64)
    shell2.setDepth(45)
    this.decorations.add(shell2)
    
    for (let i = 0; i < 5; i++) {
      const seaweed = this.add.graphics()
      const height = Phaser.Math.Between(40, 80)
      seaweed.fillStyle(0x228b22, 0.5)
      seaweed.fillEllipse(0, 0, 8, height)
      seaweed.setPosition(
        Phaser.Math.Between(3, 28) * 64,
        Phaser.Math.Between(15, 19) * 64
      )
      seaweed.setDepth(45)
      
      this.tweens.add({
        targets: seaweed,
        rotation: 0.1,
        duration: Phaser.Math.Between(2000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      this.decorations.add(seaweed)
    }
    
    const sign = this.add.graphics()
    sign.fillStyle(0x8b4513, 0.6)
    sign.fillRect(-25, -40, 50, 35)
    sign.fillRect(-3, -5, 6, 45)
    sign.setPosition(12 * 64, 14.5 * 64)
    sign.setDepth(49)
    sign.setRotation(0.1)
    this.decorations.add(sign)
    
    const signText = this.add.text(12 * 64, 14.5 * 64 - 25, '?', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '20px',
      fill: '#ffdd88'
    }).setOrigin(0.5).setDepth(50).setAlpha(0.7)
  }
}
