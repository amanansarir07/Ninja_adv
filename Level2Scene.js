import { BaseLevelScene } from './BaseLevelScene.js'
import { KakashiPlayer } from './KakashiPlayer.js'
import { SoundNinja } from './SoundNinja.js'

export class Level2Scene extends BaseLevelScene {
  constructor() {
    super({
      key: "Level2Scene",
    })
  }

  create() {
    console.log('Level2Scene create started')
    this.isInitialized = false
    try {
      this.createBaseElementsAsync().then(() => {
        this.backgroundMusic = this.sound.add("ninja_adventure_theme", {
          volume: 0.6,
          loop: true
        })
        this.backgroundMusic.play()
        this.isInitialized = true
      }).catch(error => {
        console.error('Error creating Level2Scene:', error)
        this.isInitialized = true
      })
    } catch (error) {
      console.error('Synchronous error in Level2Scene create:', error)
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
    this.mapWidth = 35 * 64
    this.mapHeight = 20 * 64
  }

  async createPlayer() {
    const playerX = 3 * 64
    const playerY = 17 * 64
    const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
    this.player = await this.createPlayerByType(selectedCharacter, playerX, playerY)
  }

  createEnemies() {
    const enemy1 = new SoundNinja(this, 12 * 64, 16 * 64)
    this.enemies.add(enemy1)
    const enemy2 = new SoundNinja(this, 20 * 64, 14 * 64)
    this.enemies.add(enemy2)
    const enemy3 = new SoundNinja(this, 23 * 64, 14 * 64)
    this.enemies.add(enemy3)
    const enemy4 = new SoundNinja(this, 30 * 64, 15 * 64)
    this.enemies.add(enemy4)
    const enemy5 = new SoundNinja(this, 17 * 64, 11 * 64)
    this.enemies.add(enemy5)
  }

  createBackground() {
    let backgroundKey = "desert_ruins_background"
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
    this.map = this.make.tilemap({ key: "level2_map" })
    this.desertGroundTileset = this.map.addTilesetImage("desert_ruins_ground", "desert_ruins_ground")
    this.groundLayer = this.map.createLayer("ground", this.desertGroundTileset, 0, 0)
    this.groundLayer.setCollisionByExclusion([-1])
  }

  createDecorations() {
    const pillar1 = this.add.image(2 * 64, 17 * 64, "desert_pillar_variant_1")
    pillar1.setOrigin(0.5, 1)
    pillar1.setScale(0.35)
    this.decorations.add(pillar1)
    
    const pillar2 = this.add.image(6 * 64, 17 * 64, "desert_pillar_variant_2")
    pillar2.setOrigin(0.5, 1)
    pillar2.setScale(0.35)
    this.decorations.add(pillar2)
    
    const pillar3 = this.add.image(11 * 64, 16 * 64, "desert_pillar_variant_3")
    pillar3.setOrigin(0.5, 1)
    pillar3.setScale(0.35)
    this.decorations.add(pillar3)
    
    const pillar4 = this.add.image(14 * 64, 16 * 64, "desert_pillar_variant_1")
    pillar4.setOrigin(0.5, 1)
    pillar4.setScale(0.35)
    this.decorations.add(pillar4)
    
    const pillar5 = this.add.image(19 * 64, 14 * 64, "desert_pillar_variant_2")
    pillar5.setOrigin(0.5, 1)
    pillar5.setScale(0.35)
    this.decorations.add(pillar5)
    
    const pillar6 = this.add.image(24 * 64, 14 * 64, "desert_pillar_variant_3")
    pillar6.setOrigin(0.5, 1)
    pillar6.setScale(0.35)
    this.decorations.add(pillar6)
    
    const pillar7 = this.add.image(29 * 64, 15 * 64, "desert_pillar_variant_1")
    pillar7.setOrigin(0.5, 1)
    pillar7.setScale(0.35)
    this.decorations.add(pillar7)
    
    const pillar8 = this.add.image(32 * 64, 15 * 64, "desert_pillar_variant_2")
    pillar8.setOrigin(0.5, 1)
    pillar8.setScale(0.35)
    this.decorations.add(pillar8)
    
    const pillar9 = this.add.image(8 * 64, 14 * 64, "desert_pillar_variant_3")
    pillar9.setOrigin(0.5, 1)
    pillar9.setScale(0.25)
    this.decorations.add(pillar9)
    
    const pillar10 = this.add.image(17 * 64, 11 * 64, "desert_pillar_variant_1")
    pillar10.setOrigin(0.5, 1)
    pillar10.setScale(0.25)
    this.decorations.add(pillar10)
    
    this.createEnvironmentalStoryElements()
  }

  createEnvironmentalStoryElements() {
    const brokenStatue = this.add.graphics()
    brokenStatue.fillStyle(0x8b8378, 0.6)
    brokenStatue.fillEllipse(0, 0, 50, 30)
    brokenStatue.fillStyle(0x696969, 0.5)
    brokenStatue.fillRect(-15, -25, 30, 25)
    brokenStatue.setPosition(10 * 64, 16.5 * 64)
    brokenStatue.setDepth(48)
    this.decorations.add(brokenStatue)
    
    const pottery1 = this.add.graphics()
    pottery1.fillStyle(0xcd853f, 0.6)
    pottery1.fillEllipse(0, 0, 20, 25)
    pottery1.setPosition(5 * 64, 17.5 * 64)
    pottery1.setDepth(47)
    pottery1.setRotation(0.5)
    this.decorations.add(pottery1)
    
    const pottery2 = this.add.graphics()
    pottery2.fillStyle(0xdaa520, 0.5)
    pottery2.fillEllipse(0, 0, 15, 18)
    pottery2.setPosition(26 * 64, 14.8 * 64)
    pottery2.setDepth(47)
    this.decorations.add(pottery2)
    
    const skullGraphic = this.add.graphics()
    skullGraphic.fillStyle(0xf5f5dc, 0.4)
    skullGraphic.fillCircle(0, 0, 12)
    skullGraphic.fillRect(-8, 10, 16, 8)
    skullGraphic.setPosition(15 * 64, 16.3 * 64)
    skullGraphic.setDepth(46)
    this.decorations.add(skullGraphic)
    
    for (let i = 0; i < 6; i++) {
      const coral = this.add.graphics()
      const coralColors = [0xff6347, 0xff7f50, 0xffa07a, 0xe9967a]
      coral.fillStyle(Phaser.Utils.Array.GetRandom(coralColors), 0.6)
      const height = Phaser.Math.Between(25, 50)
      coral.fillEllipse(0, 0, 12, height)
      coral.fillEllipse(-8, 10, 8, height * 0.6)
      coral.fillEllipse(8, 5, 8, height * 0.7)
      coral.setPosition(
        Phaser.Math.Between(4, 32) * 64,
        Phaser.Math.Between(12, 17) * 64
      )
      coral.setDepth(45)
      this.decorations.add(coral)
    }
    
    const tablet = this.add.graphics()
    tablet.fillStyle(0x4a4a4a, 0.6)
    tablet.fillRect(-20, -30, 40, 50)
    tablet.lineStyle(2, 0x696969, 0.4)
    for (let i = 0; i < 4; i++) {
      tablet.moveTo(-15, -20 + i * 12)
      tablet.lineTo(15, -20 + i * 12)
    }
    tablet.strokePath()
    tablet.setPosition(22 * 64, 14.3 * 64)
    tablet.setDepth(48)
    tablet.setRotation(-0.1)
    this.decorations.add(tablet)
    
    const chain = this.add.graphics()
    chain.lineStyle(3, 0x708090, 0.5)
    chain.beginPath()
    chain.moveTo(0, 0)
    for (let i = 0; i < 8; i++) {
      chain.lineTo(i * 12, Math.sin(i) * 5)
    }
    chain.strokePath()
    chain.setPosition(28 * 64, 15.5 * 64)
    chain.setDepth(46)
    this.decorations.add(chain)
  }
}