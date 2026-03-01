import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { narutoConfig } from './gameConfig.json'

export class NarutoPlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "naruto_idle_frame1")

    // 添加到场景和物理系统
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 角色属性
    this.scene = scene
    this.facingDirection = "right"
    this.walkSpeed = narutoConfig.walkSpeed.value
    this.jumpPower = narutoConfig.jumpPower.value

    this.isDead = false
    this.isPunching = false
    this.isKicking = false
    this.isRasengan = false
    this.isSummoning = false
    this.isHurting = false
    this.isInvulnerable = false
    this.hurtingDuration = narutoConfig.hurtingDuration.value
    this.invulnerableTime = narutoConfig.invulnerableTime.value
    this.currentMeleeTargets = new Set()
    this.maxHealth = narutoConfig.maxHealth.value
    this.health = this.maxHealth

    this.rasenganCooldown = narutoConfig.rasenganCooldown.value
    this.summoningCooldown = narutoConfig.summoningCooldown.value
    this.lastRasenganTime = 0
    this.lastSummoningTime = 0
    this.body.setGravityY(narutoConfig.gravityY.value)

    this.collisionBoxWidth = 289 * 0.9
    this.collisionBoxHeight = 560 * 0.9
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    const standardHeight = 2 * 64
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    this.setOrigin(0.5, 1.0)

    this.createAnimations()

    this.play("naruto_idle_anim")
    this.resetOriginAndOffset()

    this.createMeleeTrigger()

    this.initializeSounds()
    
    this.dustEffects = []
    this.rasenganEffect = null
    
    // Oxygen system for underwater theme
    this.maxOxygen = 100
    this.oxygen = this.maxOxygen
    this.oxygenDepletionRate = 0.015
    this.lastOxygenDamageTime = 0
    this.oxygenDamageInterval = 1000
  }

  // 初始化所有音效
  initializeSounds() {
    this.jumpSound = this.scene.sound.add("ninja_jump_sound", { volume: 0.3 })
    this.punchSound = this.scene.sound.add("naruto_punch_sound", { volume: 0.3 })
    this.kickSound = this.scene.sound.add("naruto_kick_sound", { volume: 0.3 })
    this.rasenganSound = this.scene.sound.add("rasengan_charge_sound", { volume: 0.3 })
    this.summoningSound = this.scene.sound.add("summoning_jutsu_sound", { volume: 0.3 })
    this.hurtSound = this.scene.sound.add("ninja_hurt_sound", { volume: 0.3 })
    this.dieSound = this.scene.sound.add("ninja_die_sound", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle 动画
    if (!anims.exists("naruto_idle_anim")) {
      anims.create({
        key: "naruto_idle_anim",
        frames: [
          {
            key: "naruto_idle_frame1",
            duration: 800,
          },
          {
            key: "naruto_idle_frame2", 
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk 动画
    if (!anims.exists("naruto_walk_anim")) {
      anims.create({
        key: "naruto_walk_anim",
        frames: [
          { key: "naruto_walk_frame1", duration: 300 },
          { key: "naruto_walk_frame2", duration: 300 },
          { key: "naruto_walk_frame3", duration: 300 },
          { key: "naruto_walk_frame4", duration: 300 },
        ],
        repeat: -1,
      })
    }

    // Jump Up 动画
    if (!anims.exists("naruto_jump_up_anim")) {
      anims.create({
        key: "naruto_jump_up_anim",
        frames: [{ key: "naruto_jump_frame1", duration: 300 }],
        repeat: 0,
      })
    }

    // Jump Down 动画
    if (!anims.exists("naruto_jump_down_anim")) {
      anims.create({
        key: "naruto_jump_down_anim",
        frames: [{ key: "naruto_jump_frame2", duration: 400 }],
        repeat: 0,
      })
    }

    // Punch 动画
    if (!anims.exists("naruto_punch_anim")) {
      anims.create({
        key: "naruto_punch_anim",
        frames: [
          { key: "naruto_punch_frame1", duration: 100 },
          { key: "naruto_punch_frame2", duration: 150 },
        ],
        repeat: 0,
      })
    }

    // Kick 动画
    if (!anims.exists("naruto_kick_anim")) {
      anims.create({
        key: "naruto_kick_anim",
        frames: [
          { key: "naruto_kick_frame1", duration: 120 },
          { key: "naruto_kick_frame2", duration: 180 },
        ],
        repeat: 0,
      })
    }

    // Rasengan 动画 - 蓄力时间优化到0.5秒
    if (!anims.exists("naruto_rasengan_anim")) {
      anims.create({
        key: "naruto_rasengan_anim",
        frames: [
          { key: "naruto_rasengan_frame1", duration: 250 }, // 0.25秒
          { key: "naruto_rasengan_frame2", duration: 250 },  // 0.25秒，总计0.5秒
        ],
        repeat: 0,
      })
    }

    // Summoning 动画
    if (!anims.exists("naruto_summoning_anim")) {
      anims.create({
        key: "naruto_summoning_anim",
        frames: [
          { key: "naruto_summoning_frame1", duration: 300 },
          { key: "naruto_summoning_frame2", duration: 200 },
        ],
        repeat: 0,
      })
    }

    // Die 动画
    if (!anims.exists("naruto_die_anim")) {
      anims.create({
        key: "naruto_die_anim",
        frames: [
          { key: "naruto_die_frame1", duration: 1000 },
          { key: "naruto_die_frame2", duration: 2000 },
        ],
        repeat: 0,
      })
    }
  }

  update(input, jKey, kKey, lKey, uKey) {
    if (!this.body || !this.active || this.isDead || this.isRasengan || this.isSummoning || this.isHurting) {
      this.updateOxygen()
      return
    }

    // Update oxygen
    this.updateOxygen()

    // Handle death state
    if (!this.isDead) {
      this.handleDying()
    }

    // Handle attacks
    if (!this.isDead && !this.isPunching && !this.isKicking && !this.isRasengan && !this.isSummoning && !this.isHurting) {
      this.handleAttacks(jKey, kKey, lKey, uKey)
    }

    // Handle movement
    if (!this.isDead && !this.isPunching && !this.isKicking && !this.isRasengan && !this.isSummoning && !this.isHurting) {
      this.handleMovement(input)
    }

    // Update melee trigger
    this.updateMeleeTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.play("naruto_die_anim", true)
      this.resetOriginAndOffset()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "naruto_die_anim") {
          this.scene.scene.launch("GameOverUIScene", { 
            currentLevelKey: this.scene.scene.key 
          })
        }
      })
    } else if(this.y > this.scene.mapHeight + 100 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.scene.scene.launch("GameOverUIScene", { 
        currentLevelKey: this.scene.scene.key 
      })
    }
  }

  handleAttacks(jKey, kKey, lKey, uKey) {
    // 出拳攻击（J键）
    if (Phaser.Input.Keyboard.JustDown(jKey) && !this.isPunching) {
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isPunching = true
      this.body.setVelocityX(0)

      this.play("naruto_punch_anim", true)
      this.resetOriginAndOffset()
      this.punchSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "naruto_punch_anim") {
          this.isPunching = false
          this.currentMeleeTargets.clear()
        }
      })
    }

    // 踢腿攻击（K键）
    if (Phaser.Input.Keyboard.JustDown(kKey) && !this.isKicking) {
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isKicking = true
      this.body.setVelocityX(0)

      this.play("naruto_kick_anim", true)
      this.resetOriginAndOffset()
      this.kickSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "naruto_kick_anim") {
          this.isKicking = false
          this.currentMeleeTargets.clear()
        }
      })
    }

    // 螺旋丸（L键）
    if (Phaser.Input.Keyboard.JustDown(lKey) && this.canUseRasengan()) {
      this.useRasengan()
    }

    // 通灵术（U键）
    if (Phaser.Input.Keyboard.JustDown(uKey) && this.canUseSummoning()) {
      this.useSummoning()
    }
  }

  handleMovement(input) {
    // 支持WASD和方向键的移动控制
    if (input.left) {
      this.body.setVelocityX(-this.walkSpeed)
      this.facingDirection = "left"
    } else if (input.right) {
      this.body.setVelocityX(this.walkSpeed)
      this.facingDirection = "right"
    } else {
      this.body.setVelocityX(0)
    }

    // 更新朝向
    this.setFlipX(this.facingDirection === "left")

    // 跳跃
    if (input.up && this.body.onFloor()) {
      this.body.setVelocityY(-this.jumpPower)
      this.jumpSound.play()
      this.showDustEffect()
    }

    // 更新动画
    if (!this.body.onFloor()) {
      if (this.body.velocity.y < 0) {
        this.play("naruto_jump_up_anim", true)
        this.resetOriginAndOffset()
      } else {
        this.play("naruto_jump_down_anim", true)
        this.resetOriginAndOffset()
      }
    } else if (Math.abs(this.body.velocity.x) > 0) {
      this.play("naruto_walk_anim", true)
      this.resetOriginAndOffset()
    } else {
      this.play("naruto_idle_anim", true)
      this.resetOriginAndOffset()
    }
  }

  resetOriginAndOffset() {
    // 根据不同动画返回对应的原点数据
    let baseOriginX = 0.445;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "naruto_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "naruto_walk_anim":
          baseOriginX = 0.445;
          baseOriginY = 1.0;
          break;
        case "naruto_jump_up_anim":
        case "naruto_jump_down_anim":
          baseOriginX = 0.406;
          baseOriginY = 1.0;
          break;
        case "naruto_punch_anim":
          baseOriginX = 0.206;
          baseOriginY = 1.0;
          break;
        case "naruto_kick_anim":
          baseOriginX = 0.327;
          baseOriginY = 1.0;
          break;
        case "naruto_rasengan_anim":
          baseOriginX = 0.285;
          baseOriginY = 1.0;
          break;
        case "naruto_summoning_anim":
          baseOriginX = 0.355;
          baseOriginY = 1.0;
          break;
        case "naruto_die_anim":
          baseOriginX = 0.211;
          baseOriginY = 1.0;
          break;
        default:
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
      }
    }

    let animOriginX = this.facingDirection === "left" ? (1 - baseOriginX) : baseOriginX;
    let animOriginY = baseOriginY;
    
    this.setOrigin(animOriginX, animOriginY);
    
    this.body.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    );
  }

  // 技能冷却检查
  canUseRasengan() {
    return (this.scene.time.now - this.lastRasenganTime) >= this.rasenganCooldown
  }

  canUseSummoning() {
    return (this.scene.time.now - this.lastSummoningTime) >= this.summoningCooldown
  }

  // 获取冷却剩余时间
  getRasenganCooldownRemaining() {
    return Math.max(0, this.rasenganCooldown - (this.scene.time.now - this.lastRasenganTime))
  }

  getSummoningCooldownRemaining() {
    return Math.max(0, this.summoningCooldown - (this.scene.time.now - this.lastSummoningTime))
  }

  // 创建螺旋丸范围攻击特效
  createRasenganAreaEffect() {
    // 创建螺旋丸特效
    this.rasenganEffect = this.scene.add.image(this.x, this.y - 50, "rasengan_effect")
    this.rasenganEffect.setScale(0.3)
    this.rasenganEffect.setOrigin(0.5, 0.5)
    
    // 螺旋丸旋转和放大动画
    this.scene.tweens.add({
      targets: this.rasenganEffect,
      rotation: Math.PI * 4,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 2000,
    })
  }

  // 螺旋丸攻击
  useRasengan() {
    this.lastRasenganTime = this.scene.time.now
    this.isRasengan = true
    this.body.setVelocityX(0)
    
    this.rasenganSound.play()
    this.play("naruto_rasengan_anim", true)
    this.resetOriginAndOffset()
    
    // 创建螺旋丸特效
    this.rasenganEffect = this.scene.add.image(this.x, this.y - 50, "rasengan_effect")
    this.rasenganEffect.setScale(0.3)
    this.rasenganEffect.setOrigin(0.5, 0.5)
    
    // 螺旋丸旋转动画 - 与蓄力时间同步0.5秒
    this.scene.tweens.add({
      targets: this.rasenganEffect,
      rotation: Math.PI * 4,
      duration: 500, // 0.5秒与动画同步
    })
    
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "naruto_rasengan_anim") {
        // 螺旋丸冲击
        this.performRasenganAttack()
        this.isRasengan = false
      }
    })
  }

  performRasenganAttack() {
    // 创建范围攻击特效
    const explosionEffect = this.scene.add.image(this.x, this.y - 50, "rasengan_effect")
    explosionEffect.setScale(0.5)
    explosionEffect.setOrigin(0.5, 0.5)
    explosionEffect.setAlpha(0.8)
    
    // 爆炸动画
    this.scene.tweens.add({
      targets: explosionEffect,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        explosionEffect.destroy()
      }
    })
    
    // 寻找范围内的所有敌人
    const attackRange = 250 // 更大的攻击范围
    const enemies = this.scene.enemies.children.entries.filter(enemy => 
      enemy.active && !enemy.isDead && 
      Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < attackRange
    )
    
    // 对所有敌人造成伤害
    enemies.forEach(enemy => {
      enemy.takeDamage(80) // 螺旋丸伤害很高
      
      // 强力击退效果
      const direction = enemy.x > this.x ? 1 : -1
      enemy.body.setVelocityX(direction * 400)
      enemy.body.setVelocityY(-200) // 向上击飞
    })
    
    // 清理螺旋丸特效
    if (this.rasenganEffect) {
      this.rasenganEffect.destroy()
      this.rasenganEffect = null
    }
    
    // 播放冲击音效
    if (this.scene.sound.get("rasengan_impact_sound")) {
      this.scene.sound.play("rasengan_impact_sound", { volume: 0.3 })
    }
    
    // 屏幕震动效果
    this.scene.cameras.main.shake(300, 0.01)
  }

  // 通灵术
  useSummoning() {
    this.lastSummoningTime = this.scene.time.now
    this.isSummoning = true
    this.body.setVelocityX(0)
    
    this.summoningSound.play()
    this.play("naruto_summoning_anim", true)
    this.resetOriginAndOffset()
    
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "naruto_summoning_anim") {
        this.performSummoning()
        this.isSummoning = false
      }
    })
  }

  performSummoning() {
    // 在玩家前方召唤蛤蟆
    const summonX = this.facingDirection === "right" ? this.x + 150 : this.x - 150
    const summonY = this.y
    
    // 创建召唤特效
    const summonEffect = this.scene.add.image(summonX, summonY - 50, "summoning_smoke")
    summonEffect.setScale(0.4)
    summonEffect.setOrigin(0.5, 0.5)
    summonEffect.setAlpha(0.9)
    
    // 召唤烟雾扩散动画
    this.scene.tweens.add({
      targets: summonEffect,
      scaleX: 0.8,
      scaleY: 0.8,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        summonEffect.destroy()
      }
    })
    
    // 召唤蛤蟆
    // 需要在场景中导入ToadSummon，这里通过场景的创建方法来召唤
    this.scene.createToadSummon(summonX, summonY, this.facingDirection, this)
    
    // 轻微屏幕震动效果
    this.scene.cameras.main.shake(200, 0.003)
  }

  // 创建攻击触发器
  createMeleeTrigger() {
    this.meleeTrigger = createTrigger(this.scene, 0, 0, 150, 120)
  }

  // 更新攻击触发器
  updateMeleeTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 150
    let triggerHeight = 120

    const playerCenterX = this.x
    const playerCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerWidth = 150
        triggerHeight = 120
        triggerX = playerCenterX + triggerWidth / 2
        triggerY = playerCenterY
        break;
      case "left":
        triggerWidth = 150
        triggerHeight = 120
        triggerX = playerCenterX - triggerWidth / 2
        triggerY = playerCenterY
        break;
    }
    
    this.meleeTrigger.setPosition(triggerX, triggerY)
    this.meleeTrigger.body.setSize(triggerWidth, triggerHeight)
  }

  // 显示尘土特效
  showDustEffect() {
    const dustCount = 3
    const baseY = this.y
    
    for (let i = 0; i < dustCount; i++) {
      const dustEffect = this.scene.add.image(this.x, baseY, "dust_effect")
      dustEffect.setScale(0.15)
      dustEffect.setOrigin(0.5, 1)
      
      const offsetX = (Math.random() - 0.5) * 80
      const offsetY = Math.random() * 10
      dustEffect.x += offsetX
      dustEffect.y += offsetY
      
      this.dustEffects.push(dustEffect)
      
      this.scene.tweens.add({
        targets: dustEffect,
        alpha: 0,
        scaleX: dustEffect.scaleX * 1.5,
        scaleY: dustEffect.scaleY * 1.5,
        x: dustEffect.x + (offsetX > 0 ? 30 : -30),
        duration: 600,
        onComplete: () => {
          if (dustEffect) {
            dustEffect.destroy()
            const index = this.dustEffects.indexOf(dustEffect)
            if (index > -1) {
              this.dustEffects.splice(index, 1)
            }
          }
        }
      })
    }
  }

  takeDamage(damage) {
    if (this.isInvulnerable || this.isDead) return
    this.isHurting = true
    this.isInvulnerable = true

    this.health -= damage
    this.hurtSound.play()
    
    // 显示掉血数值
    this.showDamageNumber(damage)

    // 受伤僵直
    this.scene.time.delayedCall(this.hurtingDuration, () => {
      this.isHurting = false
    })
    let flashCount = 0
    const flashInterval = 100
    const maxFlashes = Math.floor(this.invulnerableTime / flashInterval)

    const flash = () => {
      this.setVisible(!this.visible)
      flashCount++
      if (flashCount < maxFlashes) {
        this.scene.time.delayedCall(flashInterval, flash)
      } else {
        this.setVisible(true)
        this.isInvulnerable = false
      }
    }
    flash()
  }

  getHealthPercentage() {
    return (this.health / this.maxHealth) * 100
  }

  getOxygenPercentage() {
    return (this.oxygen / this.maxOxygen) * 100
  }

  updateOxygen() {
    if (this.isDead) return
    
    this.oxygen -= this.oxygenDepletionRate
    this.oxygen = Math.max(0, this.oxygen)
    
    if (this.oxygen <= 0) {
      const currentTime = this.scene.time.now
      if (currentTime - this.lastOxygenDamageTime >= this.oxygenDamageInterval) {
        this.takeDamage(5)
        this.lastOxygenDamageTime = currentTime
      }
    }
  }

  collectAirBubble(amount = 25) {
    this.oxygen = Math.min(this.maxOxygen, this.oxygen + amount)
    
    const bubbleText = this.scene.add.text(this.x, this.y - 80, '+O2', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#87ceeb',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5)
    
    this.scene.tweens.add({
      targets: bubbleText,
      y: bubbleText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => bubbleText.destroy()
    })
  }

  showDamageNumber(damage) {
    const offsetX = 40 + Math.random() * 20
    const offsetY = -60 - Math.random() * 20
    
    const color = '#ff3333'
    const fontSize = '28px'
    
    const damageText = this.scene.add.text(
      this.x + offsetX,
      this.y + offsetY,
      `-${damage}`,
      {
        fontFamily: 'RetroPixel, monospace',
        fontSize: fontSize,
        fill: color,
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true
        }
      }
    ).setOrigin(0.5, 0.5)
    
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 80,
      x: damageText.x + (Math.random() - 0.5) * 40,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        damageText.destroy()
      }
    })
  }
}
