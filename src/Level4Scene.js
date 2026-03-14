import Phaser from 'phaser'
import { BaseLevelScene } from './BaseLevelScene.js'
import { SoundNinja } from './SoundNinja.js'
import { SwiftNinja } from './SwiftNinja.js'
import { EliteNinja } from './EliteNinja.js'
import { BlazeBossEnemy } from './BlazeBossEnemy.js'
import { TideBossEnemy } from './TideBossEnemy.js'

export class Level4Scene extends BaseLevelScene {
  constructor() {
    super({
      key: "Level4Scene",
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
        console.error('Error creating Level4Scene:', error)
        this.isInitialized = true
      })
    } catch (error) {
      console.error('Synchronous error in Level4Scene create:', error)
      this.isInitialized = true
    }
  }

  async createBaseElementsAsync() {
    await this.createBaseElements()
  }

  update() {
    if (!this.isInitialized) return
    this.baseUpdate()
    if (this.isBossIntroActive) return
    this.stabilizeEnemyNavigation()
    this.updateOxygenFountains()
    this.checkFinalBossIntro()
  }

  setupMapSize() {
    this.mapWidth = 44 * 64
    this.mapHeight = 20 * 64
  }

  async createPlayer() {
    const playerX = 3 * 64
    const playerY = 17 * 64
    const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
    this.player = await this.createPlayerByType(selectedCharacter, playerX, playerY)
    // Level 4 pressure: oxygen drains faster than standard levels.
    if (this.player && typeof this.player.oxygenDepletionRate === 'number') {
      this.player.oxygenDepletionRate *= 1.35
    }
  }

  createEnemies() {
    // Stable ground-lane placements to avoid geometry trapping.
    this.spawnLaneEnemy(new SoundNinja(this, 9 * 64, 17 * 64), 7 * 64, 12 * 64)
    this.spawnLaneEnemy(new SwiftNinja(this, 15 * 64, 17 * 64), 13 * 64, 18 * 64)
    this.spawnLaneEnemy(new EliteNinja(this, 22 * 64, 17 * 64), 20 * 64, 25 * 64)
    this.spawnLaneEnemy(new SoundNinja(this, 29 * 64, 17 * 64), 27 * 64, 32 * 64)
    this.spawnLaneEnemy(new SwiftNinja(this, 35 * 64, 17 * 64), 33 * 64, 38 * 64)

    this.blazeBoss = new BlazeBossEnemy(this, 39 * 64, 17 * 64)
    this.spawnLaneEnemy(this.blazeBoss, 37 * 64, 41 * 64, true)

    // Keep final boss away from world edge to prevent boundary pinning.
    this.tideBoss = new TideBossEnemy(this, 41 * 64, 17 * 64)
    this.spawnLaneEnemy(this.tideBoss, 39 * 64, 42 * 64, true)
  }

  checkFinalBossIntro() {
    if (this.isBossIntroActive) return
    if (!this.player || !this.blazeBoss || !this.tideBoss) return
    if (this.blazeBoss.isDead && this.tideBoss.isDead) return
    if (this.player.x < 36 * 64) return

    this.triggerBossIntro(
      'BlazeBossEnemy & TideBossEnemy',
      'BLAZE COMMANDER\nTIDE COMMANDER',
      [
        'You have reached the heart of the enemy fortress.',
        'The Abyss Order will not let you go further.',
        'Two commanders emerge from the flames and tides.'
      ],
      {
        introKey: 'level4_final_boss_intro',
        bossTargets: [this.blazeBoss, this.tideBoss],
        bossHUDTitle: 'BLAZE & TIDE COMMANDERS',
        roarSoundKey: 'sharingan_distortion_sound'
      }
    )
  }

  stabilizeEnemyNavigation() {
    if (!this.enemies || !this.player) return
    const now = this.time.now

    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy || !enemy.active || enemy.isDead || !enemy.body) return

      if (enemy._lastUnstuckCheckAt === undefined) enemy._lastUnstuckCheckAt = now
      if (enemy._blockedSince === undefined) enemy._blockedSince = 0
      if (enemy._nextUnstuckJumpAt === undefined) enemy._nextUnstuckJumpAt = 0

      const blockedSide = enemy.body.blocked.left || enemy.body.blocked.right
      if (blockedSide && Math.abs(enemy.body.velocity.x) < 8) {
        if (enemy._blockedSince === 0) enemy._blockedSince = now
      } else {
        enemy._blockedSince = 0
      }

      // If pinned on geometry for a bit, force a small jump + direction update.
      const stuckForMs = enemy._blockedSince > 0 ? now - enemy._blockedSince : 0
      const canUnstuckJump = now >= enemy._nextUnstuckJumpAt
      const canJump = enemy.body.blocked.down || enemy.body.touching.down

      if (stuckForMs > 320 && canJump && canUnstuckJump) {
        enemy.body.setVelocityY(-420)
        enemy.facingDirection = this.player.x < enemy.x ? 'left' : 'right'
        enemy._nextUnstuckJumpAt = now + 900
        enemy._blockedSince = 0
      }

      // Slightly widen narrow patrol to avoid local edge-trapping.
      if (enemy.patrolLeftBound !== undefined && enemy.patrolRightBound !== undefined) {
        const width = enemy.patrolRightBound - enemy.patrolLeftBound
        if (width < 180) {
          const center = (enemy.patrolLeftBound + enemy.patrolRightBound) / 2
          enemy.patrolLeftBound = center - 120
          enemy.patrolRightBound = center + 120
        }
      }
    })
  }

  spawnLaneEnemy(enemy, leftBound, rightBound, isBoss = false) {
    enemy.patrolLeftBound = leftBound
    enemy.patrolRightBound = rightBound
    enemy.patrolDistance = Math.max(120, rightBound - leftBound)
    enemy.patrolStartX = (leftBound + rightBound) / 2
    enemy.detectionRange = Math.max(enemy.detectionRange || 300, 360)
    this.registerEnemy(enemy, { isBoss })
  }

  createBackground() {
    let backgroundKey = "fire_fortress_background"
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
      this.add.image(i * scaledBgWidth, 0, backgroundKey)
        .setOrigin(0, 0)
        .setScale(bgScale)
        .setScrollFactor(0.2)
    }
  }

  createTileMap() {
    this.map = this.make.tilemap({ key: "level4_map" })
    this.fireGroundTileset = this.map.addTilesetImage("fire_fortress_ground", "fire_fortress_ground")
    this.groundLayer = this.map.createLayer("ground", this.fireGroundTileset, 0, 0)
    this.groundLayer.setCollisionByExclusion([-1])
  }

  createDecorations() {
    const brazier1 = this.add.image(5 * 64, 18 * 64, "fire_brazier_variant_1")
    brazier1.setOrigin(0.5, 1)
    brazier1.setScale(0.3)
    this.decorations.add(brazier1)

    const brazier2 = this.add.image(14 * 64, 15 * 64, "fire_brazier_variant_2")
    brazier2.setOrigin(0.5, 1)
    brazier2.setScale(0.32)
    this.decorations.add(brazier2)

    const brazier3 = this.add.image(24 * 64, 12 * 64, "fire_brazier_variant_3")
    brazier3.setOrigin(0.5, 1)
    brazier3.setScale(0.32)
    this.decorations.add(brazier3)

    const brazier4 = this.add.image(30 * 64, 18 * 64, "fire_brazier_variant_1")
    brazier4.setOrigin(0.5, 1)
    brazier4.setScale(0.35)
    this.decorations.add(brazier4)

    const brazier5 = this.add.image(39 * 64, 18 * 64, "fire_brazier_variant_2")
    brazier5.setOrigin(0.5, 1)
    brazier5.setScale(0.35)
    this.decorations.add(brazier5)

    this.createOxygenFountains()

    this.createEnvironmentalStoryElements()
  }

  createOxygenFountains() {
    this.oxygenFountains = []
    this.nextFountainTickAt = 0
    const points = [
      { x: 15 * 64, y: 17 * 64 },
      { x: 28 * 64, y: 17 * 64 },
      { x: 40 * 64, y: 15 * 64 }
    ]
    points.forEach((p) => {
      const base = this.add.circle(p.x, p.y, 18, 0x66ddff, 0.35).setDepth(2040)
      const core = this.add.circle(p.x, p.y, 8, 0xcff6ff, 0.85).setDepth(2041)
      this.tweens.add({
        targets: [base, core],
        alpha: 0.2,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      this.oxygenFountains.push({ x: p.x, y: p.y, base, core })
      this.decorations.add(base)
      this.decorations.add(core)
    })
  }

  updateOxygenFountains() {
    if (!this.player || !this.oxygenFountains || this.time.now < this.nextFountainTickAt) return
    this.nextFountainTickAt = this.time.now + 260

    this.oxygenFountains.forEach((fountain) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, fountain.x, fountain.y)
      if (d <= 90 && typeof this.player.oxygen === 'number' && typeof this.player.maxOxygen === 'number') {
        this.player.oxygen = Math.min(this.player.maxOxygen, this.player.oxygen + 2)
      }
    })
  }

  createEnvironmentalStoryElements() {
    for (let i = 0; i < 6; i++) {
      const ember = this.add.circle(
        Phaser.Math.Between(2, 42) * 64,
        Phaser.Math.Between(10, 19) * 64,
        Phaser.Math.Between(4, 7),
        Phaser.Utils.Array.GetRandom([0xffa500, 0xff4500, 0xff6347]),
        0.5
      )
      ember.setDepth(2030)
      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(20, 40),
        alpha: 0.1,
        duration: Phaser.Math.Between(900, 1400),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      this.decorations.add(ember)
    }
  }
}
