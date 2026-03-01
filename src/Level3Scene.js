import { BaseLevelScene } from './BaseLevelScene.js'
import { KakashiPlayer } from './KakashiPlayer.js'
import { SoundNinja } from './SoundNinja.js'
import { BossEnemy } from './BossEnemy.js'

export class Level3Scene extends BaseLevelScene {
  constructor() {
    super({
      key: "Level3Scene",
    })
  }

  create() {
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
        console.error('Error creating Level3Scene:', error)
        this.isInitialized = true
      })
    } catch (error) {
      console.error('Synchronous error in Level3Scene create:', error)
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
    this.mapWidth = 40 * 64
    this.mapHeight = 22 * 64
  }

  async createPlayer() {
    const playerX = 3 * 64
    const playerY = 19 * 64
    const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
    this.player = await this.createPlayerByType(selectedCharacter, playerX, playerY)
  }

  createEnemies() {
    const enemy1 = new SoundNinja(this, 11 * 64, 17 * 64)
    this.enemies.add(enemy1)
    const enemy2 = new SoundNinja(this, 19 * 64, 18 * 64)
    this.enemies.add(enemy2)
    const enemy3 = new SoundNinja(this, 21 * 64, 13 * 64)
    this.enemies.add(enemy3)
    const enemy4 = new SoundNinja(this, 15 * 64, 10 * 64)
    this.enemies.add(enemy4)
    const enemy5 = new SoundNinja(this, 25 * 64, 9 * 64)
    this.enemies.add(enemy5)

    const boss = new BossEnemy(this, 34 * 64, 18 * 64)
    this.enemies.add(boss)
  }

  createBackground() {
    let backgroundKey = "thunder_temple_background"
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
    this.map = this.make.tilemap({ key: "level3_map" })
    this.thunderGroundTileset = this.map.addTilesetImage("thunder_temple_ground", "thunder_temple_ground")
    this.groundLayer = this.map.createLayer("ground", this.thunderGroundTileset, 0, 0)
    this.groundLayer.setCollisionByExclusion([-1])
  }

  createDecorations() {
    const crystal1 = this.add.image(2 * 64, 19 * 64, "thunder_crystal_variant_1")
    crystal1.setOrigin(0.5, 1)
    crystal1.setScale(0.4)
    this.decorations.add(crystal1)
    
    const crystal2 = this.add.image(5 * 64, 19.5 * 64, "thunder_crystal_variant_2")
    crystal2.setOrigin(0.5, 1)
    crystal2.setScale(0.4)
    this.decorations.add(crystal2)
    
    const crystal3 = this.add.image(9 * 64, 17 * 64, "thunder_crystal_variant_3")
    crystal3.setOrigin(0.5, 1)
    crystal3.setScale(0.4)
    this.decorations.add(crystal3)
    
    const crystal4 = this.add.image(17 * 64, 18 * 64, "thunder_crystal_variant_1")
    crystal4.setOrigin(0.5, 1)
    crystal4.setScale(0.4)
    this.decorations.add(crystal4)
    
    const crystal5 = this.add.image(13 * 64, 14 * 64, "thunder_crystal_variant_2")
    crystal5.setOrigin(0.5, 1)
    crystal5.setScale(0.35)
    this.decorations.add(crystal5)
    
    const crystal6 = this.add.image(20 * 64, 13 * 64, "thunder_crystal_variant_3")
    crystal6.setOrigin(0.5, 1)
    crystal6.setScale(0.4)
    this.decorations.add(crystal6)
    
    const crystal7 = this.add.image(27 * 64, 13.5 * 64, "thunder_crystal_variant_1")
    crystal7.setOrigin(0.5, 1)
    crystal7.setScale(0.4)
    this.decorations.add(crystal7)
    
    const crystal8 = this.add.image(14 * 64, 10 * 64, "thunder_crystal_variant_2")
    crystal8.setOrigin(0.5, 1)
    crystal8.setScale(0.3)
    this.decorations.add(crystal8)
    
    const crystal9 = this.add.image(24 * 64, 9 * 64, "thunder_crystal_variant_3")
    crystal9.setOrigin(0.5, 1)
    crystal9.setScale(0.3)
    this.decorations.add(crystal9)
    
    const crystal10 = this.add.image(22 * 64, 6 * 64, "thunder_crystal_variant_1")
    crystal10.setOrigin(0.5, 1)
    crystal10.setScale(0.25)
    this.decorations.add(crystal10)
    
    const crystal11 = this.add.image(32 * 64, 17 * 64, "thunder_crystal_variant_2")
    crystal11.setOrigin(0.5, 1)
    crystal11.setScale(0.4)
    this.decorations.add(crystal11)
    
    const crystal12 = this.add.image(38 * 64, 18.5 * 64, "thunder_crystal_variant_3")
    crystal12.setOrigin(0.5, 1)
    crystal12.setScale(0.4)
    this.decorations.add(crystal12)
    
    this.createEnvironmentalStoryElements()
  }

  createEnvironmentalStoryElements() {
    const whaleBones = this.add.graphics()
    whaleBones.fillStyle(0xf5f5f5, 0.4)
    for (let i = 0; i < 8; i++) {
      const ribHeight = 40 - Math.abs(i - 4) * 6
      whaleBones.fillEllipse(i * 15 - 50, 0, 4, ribHeight)
    }
    whaleBones.fillEllipse(-70, 0, 30, 15)
    whaleBones.setPosition(8 * 64, 17.5 * 64)
    whaleBones.setDepth(46)
    this.decorations.add(whaleBones)
    
    const shipwreck = this.add.graphics()
    shipwreck.fillStyle(0x8b4513, 0.5)
    shipwreck.beginPath()
    shipwreck.moveTo(-40, 0)
    shipwreck.lineTo(-30, -40)
    shipwreck.lineTo(30, -35)
    shipwreck.lineTo(40, 0)
    shipwreck.closePath()
    shipwreck.fillPath()
    shipwreck.fillStyle(0x5c3317, 0.4)
    shipwreck.fillRect(-25, -60, 8, 50)
    shipwreck.setPosition(30 * 64, 18 * 64)
    shipwreck.setDepth(47)
    shipwreck.setRotation(0.2)
    this.decorations.add(shipwreck)
    
    const glowOrb1 = this.add.circle(16 * 64, 10 * 64, 15, 0x00ffff, 0.4)
    glowOrb1.setDepth(2030)
    this.tweens.add({
      targets: glowOrb1,
      alpha: 0.15,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    const glowOrb2 = this.add.circle(26 * 64, 8 * 64, 12, 0x9400d3, 0.35)
    glowOrb2.setDepth(2030)
    this.tweens.add({
      targets: glowOrb2,
      alpha: 0.1,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    for (let i = 0; i < 4; i++) {
      const kelp = this.add.graphics()
      kelp.fillStyle(0x2e8b57, 0.5)
      const segments = Phaser.Math.Between(4, 7)
      for (let j = 0; j < segments; j++) {
        kelp.fillEllipse(Math.sin(j * 0.5) * 10, -j * 20, 10, 15)
      }
      kelp.setPosition(
        Phaser.Math.Between(5, 35) * 64,
        Phaser.Math.Between(14, 19) * 64
      )
      kelp.setDepth(45)
      
      this.tweens.add({
        targets: kelp,
        x: kelp.x + 8,
        duration: Phaser.Math.Between(2500, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      this.decorations.add(kelp)
    }
    
    const tridentParts = this.add.graphics()
    tridentParts.fillStyle(0xb8860b, 0.5)
    tridentParts.fillRect(-3, -50, 6, 60)
    tridentParts.fillStyle(0xffd700, 0.4)
    tridentParts.fillTriangle(-15, -50, 0, -65, 0, -50)
    tridentParts.fillTriangle(0, -50, 0, -70, 15, -50)
    tridentParts.setPosition(35 * 64, 17.8 * 64)
    tridentParts.setDepth(48)
    tridentParts.setRotation(0.3)
    this.decorations.add(tridentParts)
    
    const ancientRunes = this.add.graphics()
    ancientRunes.fillStyle(0x4169e1, 0.4)
    ancientRunes.fillCircle(0, 0, 40)
    ancientRunes.lineStyle(2, 0x00bfff, 0.6)
    ancientRunes.strokeCircle(0, 0, 35)
    ancientRunes.strokeCircle(0, 0, 25)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      ancientRunes.moveTo(0, 0)
      ancientRunes.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30)
    }
    ancientRunes.strokePath()
    ancientRunes.setPosition(23 * 64, 6.5 * 64)
    ancientRunes.setDepth(47)
    ancientRunes.setAlpha(0.6)
    
    this.tweens.add({
      targets: ancientRunes,
      rotation: Math.PI * 2,
      duration: 20000,
      repeat: -1,
      ease: 'Linear'
    })
    
    this.decorations.add(ancientRunes)
  }
}
