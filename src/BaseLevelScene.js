import Phaser from 'phaser'
import { ToadSummon } from './ToadSummon.js'
import { applyAudioSettings } from './settings.js'

export class BaseLevelScene extends Phaser.Scene {
  constructor(config) {
    super(config)
  }

  // Level order
  static LEVEL_ORDER = [
    "Level1Scene",
    "Level2Scene",
    "Level3Scene",
    "Level4Scene"
  ]

  getNextLevelScene() {
    const currentIndex = BaseLevelScene.LEVEL_ORDER.indexOf(this.scene.key)
    if (currentIndex >= 0 && currentIndex < BaseLevelScene.LEVEL_ORDER.length - 1) {
      return BaseLevelScene.LEVEL_ORDER[currentIndex + 1]
    }
    return null
  }

  isLastLevel() {
    const currentIndex = BaseLevelScene.LEVEL_ORDER.indexOf(this.scene.key)
    return currentIndex === BaseLevelScene.LEVEL_ORDER.length - 1
  }

  static getFirstLevelScene() {
    return BaseLevelScene.LEVEL_ORDER[0]
  }

  getCurrentLevelNumber() {
    const currentIndex = BaseLevelScene.LEVEL_ORDER.indexOf(this.scene.key)
    return currentIndex >= 0 ? currentIndex + 1 : 1
  }

  getDifficultyLabel() {
    const levelNumber = this.getCurrentLevelNumber()
    if (levelNumber === 1) return 'Normal'
    if (levelNumber === 2) return 'Hard'
    if (levelNumber === 3) return 'Nightmare'
    return 'Abyssal'
  }

  getDifficultyProfile() {
    const levelNumber = this.getCurrentLevelNumber()
    switch (levelNumber) {
      case 2:
        return {
          healthMultiplier: 1.2,
          speedMultiplier: 1.1,
          damageMultiplier: 1.12,
          detectionMultiplier: 1.06,
          attackCooldownMultiplier: 0.9
        }
      case 3:
        return {
          healthMultiplier: 1.42,
          speedMultiplier: 1.18,
          damageMultiplier: 1.24,
          detectionMultiplier: 1.12,
          attackCooldownMultiplier: 0.82
        }
      case 4:
        return {
          healthMultiplier: 1.6,
          speedMultiplier: 1.24,
          damageMultiplier: 1.34,
          detectionMultiplier: 1.16,
          attackCooldownMultiplier: 0.75
        }
      case 1:
      default:
        return {
          healthMultiplier: 1,
          speedMultiplier: 1,
          damageMultiplier: 1,
          detectionMultiplier: 1,
          attackCooldownMultiplier: 1
        }
    }
  }

  registerEnemy(enemy, options = {}) {
    this.applyEnemyDifficulty(enemy, options)
    this.enemies.add(enemy)
    return enemy
  }

  applyEnemyDifficulty(enemy, options = {}) {
    if (!enemy) return

    const profile = this.getDifficultyProfile()
    const bossMultiplier = options.isBoss ? 1.1 : 1

    const baseMaxHealth = enemy.baseMaxHealth || enemy.maxHealth || 100
    enemy.baseMaxHealth = baseMaxHealth
    enemy.maxHealth = Math.max(1, Math.round(baseMaxHealth * profile.healthMultiplier * bossMultiplier))
    enemy.health = enemy.maxHealth

    const baseWalkSpeed = enemy.baseWalkSpeed || enemy.walkSpeed || 100
    enemy.baseWalkSpeed = baseWalkSpeed
    enemy.walkSpeed = baseWalkSpeed * profile.speedMultiplier

    if (enemy.rageWalkSpeed) {
      enemy.rageWalkSpeed = enemy.rageWalkSpeed * profile.speedMultiplier
    }

    const baseContactDamage = enemy.baseContactDamage || enemy.contactDamage || 20
    enemy.baseContactDamage = baseContactDamage
    enemy.contactDamage = Math.round(baseContactDamage * profile.damageMultiplier * bossMultiplier)

    const baseMeleeDamage = enemy.baseMeleeDamage || enemy.meleeDamage || 15
    enemy.baseMeleeDamage = baseMeleeDamage
    enemy.meleeDamage = Math.round(baseMeleeDamage * profile.damageMultiplier * bossMultiplier)

    const baseDetectionRange = enemy.baseDetectionRange || enemy.detectionRange || 300
    enemy.baseDetectionRange = baseDetectionRange
    enemy.detectionRange = Math.round(baseDetectionRange * profile.detectionMultiplier)

    const baseAttackCooldown = enemy.baseAttackCooldown || enemy.attackCooldown || 2000
    enemy.baseAttackCooldown = baseAttackCooldown
    enemy.attackCooldown = Math.max(550, Math.round(baseAttackCooldown * profile.attackCooldownMultiplier))

    if (enemy.rageAttackCooldown) {
      enemy.rageAttackCooldown = Math.max(450, Math.round(enemy.rageAttackCooldown * profile.attackCooldownMultiplier))
    }
  }

  async createBaseElements() {
    try {
      applyAudioSettings(this)
      this.isPausing = false
      this.isBossIntroActive = false
      this.bossIntroPlayedKeys = new Set()
      this.activeBossHUD = null
      this.frozenEntities = []
      this.gameCompleted = false
      this.levelStartTime = this.time.now
      this.levelStartTimestamp = Date.now()
      this.registry.set('currentLevelNumber', this.getCurrentLevelNumber())
      this.registry.set('difficultyLabel', this.getDifficultyLabel())
      if (this.scene.key === 'Level1Scene') {
        this.registry.set('seaCreaturesSaved', 0)
      }
      this.setupMapSize()
      this.createBackground()
      this.createWaterOverlay()
      this.createCausticsEffect()
      this.createBubbles()
      this.createAirBubbleCollectibles()
      this.createHiddenTreasures()
      this.createSeaCreaturesBackground()
      this.createTileMap()
      this.decorations = this.add.group()
      this.createDecorations()
      this.enemies = this.add.group()
      this.createEnemies()
      this.summons = this.add.group()
      await this.createPlayer()
      this.setupBaseCollisions()
      this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight)
      if (this.player) {
        this.cameras.main.startFollow(this.player)
        this.cameras.main.setLerp(0.1, 0.1)
        if (this.player.body) {
          this.player.body.setCollideWorldBounds(true)
        }
      }
      this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight, true, true, true, false)
      this.setupInputs()
      this.setupMeleeCollision()
      this.nextCausticsUpdateAt = 0
      this.nextDecorationFadeUpdateAt = 0
      this.time.delayedCall(200, () => {
        if (!this.scene.isActive('UIScene')) {
          this.scene.launch('UIScene')
        }
        this.scene.bringToTop('UIScene')
      })
    } catch (error) {
      console.error('Error in BaseLevelScene createBaseElements:', error)
      throw error
    }
  }

  triggerBossIntro(bossName, bossTitle, dialogueLines, options = {}) {
    const introKey = options.introKey || `${this.scene.key}_${bossTitle}`
    if (this.isBossIntroActive) return
    if (this.bossIntroPlayedKeys.has(introKey)) return
    this.bossIntroPlayedKeys.add(introKey)

    const bossTargets = Array.isArray(options.bossTargets) ? options.bossTargets.filter(Boolean) : []
    const focusPoint = this.getBossIntroFocusPoint(bossTargets)
    this.prepareBossIntroFreeze(bossTargets)
    this.isBossIntroActive = true
    this.pendingBossIntroData = {
      bossTitle,
      bossHUDTitle: options.bossHUDTitle || bossTitle,
      bossTargets,
      cameraFollowTarget: this.player,
      roarSoundKey: options.roarSoundKey || 'ninja_hurt_sound'
    }

    this.scene.launch('BossIntroScene', {
      levelSceneKey: this.scene.key,
      bossName,
      bossTitle,
      dialogueLines,
      focusPoint,
      roarSoundKey: this.pendingBossIntroData.roarSoundKey
    })
    this.scene.bringToTop('BossIntroScene')
  }

  getBossIntroFocusPoint(bossTargets) {
    if (!bossTargets.length) {
      return this.player ? { x: this.player.x, y: this.player.y } : null
    }
    const aliveTargets = bossTargets.filter((boss) => boss && boss.active)
    if (!aliveTargets.length) return null
    const sum = aliveTargets.reduce((acc, boss) => {
      acc.x += boss.x
      acc.y += boss.y
      return acc
    }, { x: 0, y: 0 })
    return {
      x: sum.x / aliveTargets.length,
      y: sum.y / aliveTargets.length
    }
  }

  prepareBossIntroFreeze(bossTargets) {
    const allTargets = [this.player, ...this.enemies.getChildren(), ...this.summons.getChildren()]
    allTargets.forEach((entity) => this.freezeEntity(entity))
    if (this.cameras && this.cameras.main) {
      this.cameras.main.stopFollow()
    }

    bossTargets.forEach((boss) => {
      if (!boss) return
      boss.aiState = 'idle'
      boss.setTint(0xff6666)
      this.time.delayedCall(220, () => {
        if (boss.active && !boss.isDead) boss.clearTint()
      })
    })
  }

  freezeEntity(entity) {
    if (!entity || !entity.body) return
    this.frozenEntities.push({ entity, moves: entity.body.moves })
    entity.body.setVelocity(0, 0)
    entity.body.moves = false
  }

  completeBossIntro() {
    if (!this.isBossIntroActive) return
    this.isBossIntroActive = false

    this.frozenEntities.forEach(({ entity, moves }) => {
      if (!entity || !entity.body) return
      entity.body.moves = moves
      entity.body.setVelocity(0, 0)
    })
    this.frozenEntities = []

    if (this.pendingBossIntroData) {
      const aliveBosses = this.pendingBossIntroData.bossTargets.filter((boss) => boss && boss.active && !boss.isDead)
      aliveBosses.forEach((boss) => {
        boss.aiState = 'chase'
      })
      this.activeBossHUD = {
        title: this.pendingBossIntroData.bossHUDTitle,
        bosses: aliveBosses
      }
    }

    if (this.cameras && this.cameras.main) {
      this.cameras.main.zoomTo(1, 420, 'Sine.easeOut')
      if (this.player) {
        this.cameras.main.startFollow(this.player)
      }
      this.cameras.main.shake(140, 0.004)
    }

    if (this.backgroundMusic) {
      if (!this.backgroundMusic.isPlaying) this.backgroundMusic.play()
      this.tweens.add({
        targets: this.backgroundMusic,
        volume: 0.8,
        duration: 380
      })
    }

    this.pendingBossIntroData = null
  }

  getBossHUDData() {
    if (!this.activeBossHUD || !Array.isArray(this.activeBossHUD.bosses)) return null
    const alive = this.activeBossHUD.bosses.filter((boss) => boss && boss.active && !boss.isDead && boss.maxHealth > 0)
    if (!alive.length) {
      this.activeBossHUD = null
      return null
    }

    const totalHealth = alive.reduce((sum, boss) => sum + Math.max(0, boss.health || 0), 0)
    const totalMaxHealth = alive.reduce((sum, boss) => sum + Math.max(1, boss.maxHealth || 1), 0)
    const healthRatio = Phaser.Math.Clamp(totalHealth / totalMaxHealth, 0, 1)

    return {
      title: this.activeBossHUD.title,
      healthRatio
    }
  }

  createWaterOverlay() {
    const waterColor = 0x1a5f7a
    const alpha = 0.32
    this.waterOverlay = this.add.graphics()
    this.waterOverlay.fillStyle(waterColor, alpha)
    this.waterOverlay.fillRect(0, 0, this.mapWidth, this.mapHeight)
    this.waterOverlay.setScrollFactor(1)
    this.waterOverlay.setDepth(2000)
  }

  createBubbles() {
    this.bubbles = []
    const count = 18
    const colors = [0x87ceeb, 0xb0e0e6, 0xadd8e6, 0xafeeee]
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, this.mapWidth)
      const y = Phaser.Math.Between(0, this.mapHeight)
      const radius = Phaser.Math.Between(4, 14)
      const color = Phaser.Utils.Array.GetRandom(colors)
      const bubble = this.add.circle(x, y, radius, color, 0.4)
      bubble.setScrollFactor(1)
      bubble.setDepth(1500)
      bubble.riseSpeed = Phaser.Math.FloatBetween(0.6, 1.8)
      this.bubbles.push(bubble)
    }
  }

  createCausticsEffect() {
    this.caustics = this.add.graphics()
    this.caustics.setDepth(1999)
    this.caustics.setAlpha(0.12)
    this.caustics.setScrollFactor(0.5)
    this.causticsTime = 0
  }

  updateCaustics() {
    if (!this.caustics) return
    
    this.causticsTime += 0.02
    this.caustics.clear()
    
    const camera = this.cameras.main
    const startX = camera.scrollX - 100
    const startY = camera.scrollY - 100
    const endX = startX + camera.width + 200
    const endY = startY + camera.height + 200
    
    this.caustics.fillStyle(0x87ceeb, 0.15)
    
    for (let x = startX; x < endX; x += 96) {
      for (let y = startY; y < endY; y += 96) {
        const offset = Math.sin(this.causticsTime + x * 0.01 + y * 0.01) * 20
        const size = 30 + Math.sin(this.causticsTime * 1.5 + x * 0.02) * 10
        this.caustics.fillCircle(x + offset, y + offset * 0.5, size)
      }
    }
  }

  createAirBubbleCollectibles() {
    this.airBubbleCollectibles = this.add.group()
    
    const bubbleCount = 6
    for (let i = 0; i < bubbleCount; i++) {
      const x = Phaser.Math.Between(200, this.mapWidth - 200)
      const y = Phaser.Math.Between(200, this.mapHeight - 200)
      
      const bubble = this.add.circle(x, y, 20, 0x87ceeb, 0.7)
      bubble.setDepth(2050)
      bubble.setScrollFactor(1)
      bubble.originalY = y
      
      const innerBubble = this.add.circle(x - 5, y - 5, 6, 0xffffff, 0.6)
      innerBubble.setDepth(2051)
      innerBubble.setScrollFactor(1)
      bubble.innerBubble = innerBubble
      
      this.physics.add.existing(bubble, true)
      bubble.body.setCircle(20)
      
      this.airBubbleCollectibles.add(bubble)
      
      this.tweens.add({
        targets: [bubble, innerBubble],
        y: y - 10,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  createHiddenTreasures() {
    this.hiddenTreasures = this.add.group()
    this.treasuresCollected = 0
    
    const treasureCount = 4 
    const treasureColors = [0xffd700, 0xffc125, 0xdaa520]
    
    for (let i = 0; i < treasureCount; i++) {
      const x = Phaser.Math.Between(300, this.mapWidth - 300)
      const y = Phaser.Math.Between(300, this.mapHeight - 200)
      const color = Phaser.Utils.Array.GetRandom(treasureColors)
      
      const treasure = this.add.graphics()
      treasure.fillStyle(color, 1)
      treasure.fillRoundedRect(-15, -12, 30, 24, 4)
      treasure.fillStyle(0xb8860b, 1)
      treasure.fillRect(-12, -3, 24, 6)
      treasure.setPosition(x, y)
      treasure.setDepth(2040)
      treasure.setScrollFactor(1)
      treasure.setAlpha(0.15)
      treasure.isRevealed = false
      treasure.isCollected = false
      treasure.treasureX = x
      treasure.treasureY = y
      
      this.hiddenTreasures.add(treasure)
    }
  }

  updateHiddenTreasures() {
    if (!this.hiddenTreasures || !this.player) return
    
    const playerX = this.player.x
    const playerY = this.player.y
    const revealDistance = 120
    const collectDistance = 40
    
    this.hiddenTreasures.getChildren().forEach(treasure => {
      if (treasure.isCollected) return
      
      const distance = Phaser.Math.Distance.Between(
        playerX, playerY, treasure.treasureX, treasure.treasureY
      )
      
      if (distance < revealDistance && !treasure.isRevealed) {
        treasure.isRevealed = true
        this.tweens.add({
          targets: treasure,
          alpha: 1,
          duration: 500,
          ease: 'Power2.easeOut'
        })
        
        this.tweens.add({
          targets: treasure,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }
      
      if (distance < collectDistance && treasure.isRevealed) {
        treasure.isCollected = true
        this.collectTreasure(treasure)
      }
    })
  }

  collectTreasure(treasure) {
    this.treasuresCollected++
    
    const x = treasure.treasureX
    const y = treasure.treasureY
    
    for (let i = 0; i < 8; i++) {
      const spark = this.add.circle(x, y, 4, 0xffd700, 1)
      spark.setDepth(3000)
      const angle = (i / 8) * Math.PI * 2
      const distance = 50
      
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 500,
        onComplete: () => spark.destroy()
      })
    }
    
    const bonusText = this.add.text(x, y - 30, '+50 BONUS!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3001)
    
    this.tweens.add({
      targets: bonusText,
      y: y - 80,
      alpha: 0,
      duration: 1200,
      onComplete: () => bonusText.destroy()
    })
    
    if (this.player && this.player.collectAirBubble) {
      this.player.oxygen = Math.min(this.player.maxOxygen, this.player.oxygen + 50)
    }
    
    treasure.destroy()
    
    this.cameras.main.flash(100, 255, 215, 0, false)
  }

  checkAirBubbleCollection() {
    if (!this.airBubbleCollectibles || !this.player) return
    
    const playerX = this.player.x
    const playerY = this.player.y
    const collectDistance = 35
    
    this.airBubbleCollectibles.getChildren().forEach(bubble => {
      if (!bubble.active) return
      
      const distance = Phaser.Math.Distance.Between(playerX, playerY, bubble.x, bubble.y)
      
      if (distance < collectDistance) {
        if (this.player.collectAirBubble) {
          this.player.collectAirBubble(25)
        }
        
        for (let i = 0; i < 6; i++) {
          const smallBubble = this.add.circle(bubble.x, bubble.y, 5, 0x87ceeb, 0.8)
          smallBubble.setDepth(3000)
          const angle = (i / 6) * Math.PI * 2
          this.tweens.add({
            targets: smallBubble,
            x: bubble.x + Math.cos(angle) * 30,
            y: bubble.y + Math.sin(angle) * 30 - 20,
            alpha: 0,
            duration: 400,
            onComplete: () => smallBubble.destroy()
          })
        }
        
        if (bubble.innerBubble) {
          bubble.innerBubble.destroy()
        }
        bubble.destroy()
      }
    })
  }

  // Background sea life: subtle fish and jelly blobs on top of water overlay
  createSeaCreaturesBackground() {
    this.seaCreatures = []
    const fishCount = 16
    for (let i = 0; i < fishCount; i++) {
      const x = Phaser.Math.Between(0, this.mapWidth)
      const y = Phaser.Math.Between(60, this.mapHeight - 60)
      const fish = this.add.ellipse(
        x,
        y,
        Phaser.Math.Between(16, 30),
        Phaser.Math.Between(8, 14),
        Phaser.Utils.Array.GetRandom([0x9bd6ff, 0x7ec8e3, 0xb2f7ef, 0xa1ffce]),
        0.45
      )
      fish.setScrollFactor(0.2)
      fish.setDepth(2005)
      fish.vx = Phaser.Math.FloatBetween(-0.6, 0.6) || 0.25
      fish.vy = Phaser.Math.FloatBetween(-0.08, 0.08)
      fish.type = 'fish'
      this.seaCreatures.push(fish)
    }

    const jellyCount = 8
    for (let i = 0; i < jellyCount; i++) {
      const x = Phaser.Math.Between(0, this.mapWidth)
      const y = Phaser.Math.Between(80, this.mapHeight - 80)
      const jelly = this.add.circle(
        x,
        y,
        Phaser.Math.Between(10, 18),
        Phaser.Utils.Array.GetRandom([0xdcc6ff, 0xc6e7ff, 0xbde0fe]),
        0.3
      )
      jelly.setScrollFactor(0.15)
      jelly.setDepth(2004)
      jelly.vx = Phaser.Math.FloatBetween(-0.15, 0.15)
      jelly.vy = Phaser.Math.FloatBetween(-0.35, -0.12)
      jelly.type = 'jelly'
      this.seaCreatures.push(jelly)
    }
  }

  spawnSavedCreatureEffect(x, y) {
    const saved = (this.registry.get('seaCreaturesSaved') || 0) + 1
    this.registry.set('seaCreaturesSaved', saved)
    
    // Burst of bubbles particle effect
    const bubbleColors = [0x87ceeb, 0xb0e0e6, 0xadd8e6, 0x4dff88]
    for (let i = 0; i < 12; i++) {
      const bubble = this.add.circle(x, y - 20, Phaser.Math.Between(3, 10), 
        Phaser.Utils.Array.GetRandom(bubbleColors), 0.8)
      bubble.setDepth(3000)
      bubble.setScrollFactor(1)
      
      const angle = (i / 12) * Math.PI * 2
      const distance = Phaser.Math.Between(40, 100)
      const targetX = x + Math.cos(angle) * distance
      const targetY = y - 20 + Math.sin(angle) * distance - Phaser.Math.Between(30, 80)
      
      this.tweens.add({
        targets: bubble,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: Phaser.Math.Between(600, 1000),
        ease: 'Power2.easeOut',
        onComplete: () => bubble.destroy()
      })
    }
    
    // Glowing fish that swims away
    const fishColors = [0x4dff88, 0x6bcb77, 0x1abc9c, 0x4d96ff]
    const fish = this.add.ellipse(x, y - 20, 32, 14, 
      Phaser.Utils.Array.GetRandom(fishColors), 1)
    fish.setScrollFactor(1)
    fish.setDepth(3000)
    
    // Fish glow effect
    const glow = this.add.circle(x, y - 20, 25, 0x4dff88, 0.4)
    glow.setScrollFactor(1)
    glow.setDepth(2999)
    
    const swimDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1
    
    this.tweens.add({
      targets: [fish, glow],
      x: x + swimDirection * 180,
      y: y - 150,
      alpha: 0,
      duration: 1800,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        fish.destroy()
        glow.destroy()
      }
    })
    
    // Pulse glow animation
    this.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      yoyo: true,
      repeat: 2
    })
    
    // "Saved!" text with bounce effect
    const savedText = this.add.text(x, y - 50, 'SAVED!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '18px',
      fill: '#4dff88',
      stroke: '#0a3d0a',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5).setScrollFactor(1).setDepth(3001)
    
    // Bounce in
    savedText.setScale(0.1)
    this.tweens.add({
      targets: savedText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: savedText,
          scaleX: 1,
          scaleY: 1,
          y: savedText.y - 80,
          alpha: 0,
          duration: 1200,
          delay: 300,
          ease: 'Power2.easeOut',
          onComplete: () => savedText.destroy()
        })
      }
    })
    
    // Camera flash effect
    this.cameras.main.flash(150, 100, 255, 150, false, null, this)
  }

  setupBaseCollisions() {
    if (this.player && this.groundLayer) {
      this.physics.add.collider(this.player, this.groundLayer)
    }
    
    if (this.enemies && this.groundLayer) {
      this.physics.add.collider(this.enemies, this.groundLayer)
    }

    if (this.summons && this.groundLayer) {
      this.physics.add.collider(this.summons, this.groundLayer)
    }

    if (this.player && this.enemies) {
      this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
        if (player.isInvulnerable || player.isHurting || player.isDead || enemy.isDead) return
        const knockbackForce = player.x < enemy.x ? -200 : 200
        player.body.setVelocityX(knockbackForce)
        const contactDamage = enemy.contactDamage !== undefined ? enemy.contactDamage : 20
        player.takeDamage(contactDamage)
      })
    }
  }

  setupInputs() {
    this.keys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      K: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      L: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      U: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U)
    }
    
    this.cursors = this.input.keyboard.createCursorKeys()
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
  }

  setupMeleeCollision() {
    if (!this.player || !this.enemies || !this.player.meleeTrigger) {
      console.warn('Player or enemies or meleeTrigger not ready for collision setup')
      return
    }

    this.physics.add.overlap(
      this.player.meleeTrigger,
      this.enemies,
      (trigger, enemy) => {
        let isAttacking = this.player.isPunching || this.player.isKicking
        const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
        if (selectedCharacter === 'NarutoPlayer') {
          isAttacking = isAttacking || this.player.isRasengan || this.player.isSummoning
        } else {
          isAttacking = isAttacking || this.player.isChidori || this.player.isSharingan
        }
        
        if (isAttacking && !this.player.currentMeleeTargets.has(enemy)) {
          if (enemy.isHurting || enemy.isDead) return
          this.player.currentMeleeTargets.add(enemy)
          const knockbackForce = enemy.x < this.player.x ? -300 : 300
          enemy.body.setVelocityX(knockbackForce)
          
          let damage = 20
          if (this.player.isPunching) damage = 20
          else if (this.player.isKicking) damage = 25
          
          if (selectedCharacter === 'NarutoPlayer') {
          if (this.player.isRasengan) damage = 80
          else if (this.player.isSummoning) damage = 60
        } else {
          if (this.player.isChidori) damage = 50
          else if (this.player.isSharingan) damage = 120
        }
        enemy.takeDamage(damage)
      }
      }
    )

    this.enemies.children.entries.forEach(enemy => {
      if (enemy.meleeTrigger) {
        this.physics.add.overlap(
          enemy.meleeTrigger,
          this.player,
          (trigger, player) => {
            if (enemy.isAttacking && !enemy.currentMeleeTargets.has(player)) {
              if (player.isHurting || player.isDead || player.isInvulnerable) return
              enemy.currentMeleeTargets.add(player)
              const knockbackForce = player.x < enemy.x ? -200 : 200
              player.body.setVelocityX(knockbackForce)
              const meleeDamage = enemy.meleeDamage !== undefined ? enemy.meleeDamage : 15
              player.takeDamage(meleeDamage)
            }
          }
        )
      }
    })

    this.setupSummonCollisions()
  }

  setupSummonCollisions() {
    if (!this.summons) return
    this.summons.children.entries.forEach(summon => {
      if (summon.meleeTrigger) {
        this.physics.add.overlap(
          summon.meleeTrigger,
          this.enemies,
          (trigger, enemy) => {
            if (summon.isAttacking && !summon.currentMeleeTargets.has(enemy)) {
              if (enemy.isHurting || enemy.isDead) return
              summon.currentMeleeTargets.add(enemy)
              const knockbackForce = enemy.x < summon.x ? -250 : 250
              enemy.body.setVelocityX(knockbackForce)
              enemy.takeDamage(40)
            }
          }
        )
        this.enemies.children.entries.forEach(enemy => {
          if (enemy.meleeTrigger) {
            this.physics.add.overlap(
              enemy.meleeTrigger,
              summon,
              (trigger, targetSummon) => {
                if (enemy.isAttacking && !enemy.currentMeleeTargets.has(targetSummon)) {
                  if (targetSummon.isHurting || targetSummon.isDead) return
                  enemy.currentMeleeTargets.add(targetSummon)
                  targetSummon.takeDamage(25)
                }
              }
            )
          }
        })
      }
    })
  }



  baseUpdate() {
    if (this.isBossIntroActive) return

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      void this.pauseGame()
      return
    }
    if (!this.player) {
      console.warn('Player not created yet, skipping baseUpdate')
      return
    }

    try {
      this.player.update(
        {
          left: this.keys.A.isDown || this.cursors.left.isDown,
          right: this.keys.D.isDown || this.cursors.right.isDown,
          up: this.keys.W.isDown || this.cursors.up.isDown,
          down: this.keys.S.isDown || this.cursors.down.isDown
        },
        this.keys.J,
        this.keys.K,
        this.keys.L,
        this.keys.U
      )
    } catch (error) {
      console.error('Error updating player:', error)
    }

    // Update enemies and apply distance-based visibility (clear up close, foggier far away)
    const playerX = this.player.x
    const playerY = this.player.y
    const nearDist = 220
    const farDist = 520
    const minAlpha = 0.38

    this.enemies.children.entries.forEach(enemy => {
      if (enemy.active) {
        try {
          enemy.update()
          const d = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y)
          const alpha = d <= nearDist ? 1 : Math.max(minAlpha, 1 - (1 - minAlpha) * ((d - nearDist) / (farDist - nearDist)))
          enemy.setAlpha(alpha)
        } catch (error) {
          console.error('Error updating enemy:', error)
        }
      }
    })

    // Update summons and apply distance visibility
    this.summons.children.entries.forEach(summon => {
      if (summon.active) {
        try {
          summon.update()
          const d = Phaser.Math.Distance.Between(playerX, playerY, summon.x, summon.y)
          const alpha = d <= nearDist ? 1 : Math.max(minAlpha, 1 - (1 - minAlpha) * ((d - nearDist) / (farDist - nearDist)))
          summon.setAlpha(alpha)
        } catch (error) {
          console.error('Error updating summon:', error)
        }
      }
    })

    if (this.time.now >= this.nextDecorationFadeUpdateAt) {
      this.nextDecorationFadeUpdateAt = this.time.now + 120
      if (this.decorations && this.decorations.getChildren) {
        this.decorations.getChildren().forEach(obj => {
          if (obj.active && obj.alpha !== undefined) {
            const d = Phaser.Math.Distance.Between(playerX, playerY, obj.x, obj.y)
            const alpha = d <= nearDist ? 1 : Math.max(minAlpha, 1 - (1 - minAlpha) * ((d - nearDist) / (farDist - nearDist)))
            obj.setAlpha(alpha)
          }
        })
      }
    }

    if (this.bubbles && this.bubbles.length) {
      this.bubbles.forEach(bubble => {
        if (bubble.active) {
          bubble.y -= bubble.riseSpeed
          if (bubble.y < -30) {
            bubble.y = this.mapHeight + Phaser.Math.Between(20, 80)
            bubble.x = Phaser.Math.Between(0, this.mapWidth)
          }
        }
      })
    }

    if (this.seaCreatures && this.seaCreatures.length) {
      this.seaCreatures.forEach(c => {
        if (!c.active) return
        c.x += c.vx
        c.y += c.vy
        if (c.type === 'jelly') {
          c.vx += Phaser.Math.FloatBetween(-0.01, 0.01)
          c.vx = Phaser.Math.Clamp(c.vx, -0.18, 0.18)
        }
        if (c.x < -60) c.x = this.mapWidth + 60
        if (c.x > this.mapWidth + 60) c.x = -60
        if (c.y < -40) c.y = this.mapHeight + 40
        if (c.y > this.mapHeight + 40) c.y = -40
      })
    }

    if (this.time.now >= this.nextCausticsUpdateAt) {
      this.nextCausticsUpdateAt = this.time.now + 34
      this.updateCaustics()
    }
    
    // Check air bubble collection
    this.checkAirBubbleCollection()
    
    // Update hidden treasures visibility and collection
    this.updateHiddenTreasures()

    this.checkEnemiesDefeated()
  }

  pauseGame() {
    if (this.isBossIntroActive) return
    if (this.scene.isActive('PauseUIScene')) return

    if (this.sound.get("ui_click_sound")) {
      this.sound.play("ui_click_sound", { volume: 0.3 })
    }

    this.scene.pause()
    if (this.scene.isActive("UIScene")) {
      this.scene.pause("UIScene")
    }
    this.scene.launch("PauseUIScene", { 
      currentLevelKey: this.scene.key 
    })
  }

  checkEnemiesDefeated() {
    const currentEnemyCount = this.enemies.children.entries.filter(enemy => enemy.active).length
    if (currentEnemyCount === 0 && !this.gameCompleted) {
      this.gameCompleted = true

      if (this.isLastLevel()) {
        console.log("Game completed!")
        this.scene.launch("GameCompleteUIScene", { 
          currentLevelKey: this.scene.key
        })
      } else {
        this.scene.launch("VictoryUIScene", { 
          currentLevelKey: this.scene.key
        })
      }
    }
  }

  getRemainingEnemyCount() {
    if (!this.enemies) return 0
    return this.enemies.children.entries.filter(enemy => enemy.active).length
  }

  getElapsedSeconds() {
    const startedAt = this.levelStartTimestamp ?? Date.now()
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  }

  setupMapSize() {
    throw new Error("setupMapSize method must be implemented by subclass")
  }

  createPlayer() {
    throw new Error("createPlayer method must be implemented by subclass")
  }

  async createPlayerByType(playerClass, x, y) {
    console.log(`Creating player of type: ${playerClass} at position (${x}, ${y})`)
    try {
      switch(playerClass) {
        case 'SasukePlayer': {
          console.log('Importing SasukePlayer...')
          const { SasukePlayer } = await import('./SasukePlayer.js')
          console.log('SasukePlayer imported, creating instance...')
          return new SasukePlayer(this, x, y)
        }
        case 'NarutoPlayer': {
          console.log('Importing NarutoPlayer...')
          const { NarutoPlayer } = await import('./NarutoPlayer.js')
          console.log('NarutoPlayer imported, creating instance...')
          return new NarutoPlayer(this, x, y)
        }
        case 'KakashiPlayer':
        default: {
          console.log('Importing KakashiPlayer (default)...')
          const { KakashiPlayer } = await import('./KakashiPlayer.js')
          console.log('KakashiPlayer imported, creating instance...')
          return new KakashiPlayer(this, x, y)
        }
      }
    } catch (error) {
      console.error('Error in createPlayerByType:', error)
      throw error
    }
  }

  createEnemies() {
    throw new Error("createEnemies method must be implemented by subclass")
  }

  createBackground() {
    throw new Error("createBackground method must be implemented by subclass")
  }

  createTileMap() {
    throw new Error("createTileMap method must be implemented by subclass")
  }

  createDecorations() {
    throw new Error("createDecorations method must be implemented by subclass")
  }

  showDamageNumber(x, y, damage) {
    let color = '#ffffff'
    let fontSize = 24
    if (damage >= 100) {
      color = '#ff0000'
      fontSize = 32
    } else if (damage >= 50) {
      color = '#ff6600'
      fontSize = 28
    } else if (damage >= 30) {
      color = '#ffff00'
      fontSize = 26
    }
    const damageText = this.add.text(x, y, damage.toString(), {
      fontFamily: 'RetroPixel, monospace',
      fontSize: fontSize + 'px',
      fill: color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5)
    this.tweens.add({
      targets: damageText,
      y: y - 60,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy()
      }
    })
  }

  createToadSummon(x, y, facingDirection, summoner) {
    const toad = new ToadSummon(this, x, y)
    toad.facingDirection = facingDirection
    toad.setFlipX(toad.facingDirection === "left")
    toad.setSummoner(summoner)
    this.summons.add(toad)
    if (this.enemies) {
      this.physics.add.overlap(
        toad.meleeTrigger,
        this.enemies,
        (trigger, enemy) => {
          if (toad.isAttacking && !toad.currentMeleeTargets.has(enemy)) {
            if (enemy.isHurting || enemy.isDead) return
            toad.currentMeleeTargets.add(enemy)
            const knockbackForce = 150
            const direction = enemy.x > toad.x ? 1 : -1
            enemy.body.setVelocityX(direction * knockbackForce)
            
            enemy.takeDamage(35)
          }
        }
      )
    }
    
    return toad
  }
}
