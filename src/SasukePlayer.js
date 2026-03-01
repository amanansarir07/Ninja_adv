import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { sasukeConfig } from './gameConfig.json'

export class SasukePlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "sasuke_idle_frame1")

    // 添加到场景和物理系统
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 角色属性
    this.scene = scene
    this.facingDirection = "right"
    this.walkSpeed = sasukeConfig.walkSpeed.value
    this.jumpPower = sasukeConfig.jumpPower.value

    // 状态标志
    this.isDead = false // 死亡状态
    this.isPunching = false // 出拳状态
    this.isKicking = false // 踢腿状态
    this.isChidori = false // 千鸟状态
    this.isSharingan = false // 写轮眼状态
    this.isHurting = false // 受伤僵直状态
    this.isInvulnerable = false // 无敌状态
    this.hurtingDuration = sasukeConfig.hurtingDuration.value // 受伤僵直时间
    this.invulnerableTime = sasukeConfig.invulnerableTime.value // 无敌时间
    
    // 攻击目标记录系统
    this.currentMeleeTargets = new Set() // 记录当前攻击已命中的目标

    // 玩家血量系统
    this.maxHealth = sasukeConfig.maxHealth.value
    this.health = this.maxHealth

    // 技能冷却系统
    this.chidoriCooldown = sasukeConfig.chidoriCooldown.value
    this.sharinganCooldown = sasukeConfig.sharinganCooldown.value
    this.lastChidoriTime = 0 // 上次使用千鸟的时间
    this.lastSharinganTime = 0 // 上次使用写轮眼的时间

    // 设置物理属性
    this.body.setGravityY(sasukeConfig.gravityY.value)

    // 根据 idle 动画设置碰撞盒子
    this.collisionBoxWidth = 310 * 0.9
    this.collisionBoxHeight = 560 * 0.9
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // 设置角色缩放
    const standardHeight = 2 * 64
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    // 设置初始 origin
    this.setOrigin(0.5, 1.0)

    // 创建动画
    this.createAnimations()

    // 播放idle动画
    this.play("sasuke_idle_anim")
    this.resetOriginAndOffset()

    // 创建攻击触发器
    this.createMeleeTrigger()

    // 初始化所有音效
    this.initializeSounds()
    
    // 特效
    this.dustEffects = []
    this.sharinganEffect = null
    
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
    this.punchSound = this.scene.sound.add("punch_sound", { volume: 0.3 })
    this.kickSound = this.scene.sound.add("kick_sound", { volume: 0.3 })
    this.chidoriSound = this.scene.sound.add("chidori_sound", { volume: 0.3 })
    this.sharinganSound = this.scene.sound.add("sharingan_distortion_sound", { volume: 0.3 })
    this.hurtSound = this.scene.sound.add("ninja_hurt_sound", { volume: 0.3 })
    this.dieSound = this.scene.sound.add("ninja_die_sound", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle 动画
    if (!anims.exists("sasuke_idle_anim")) {
      anims.create({
        key: "sasuke_idle_anim",
        frames: [
          {
            key: "sasuke_idle_frame1",
            duration: 800,
          },
          {
            key: "sasuke_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk 动画
    if (!anims.exists("sasuke_walk_anim")) {
      anims.create({
        key: "sasuke_walk_anim",
        frames: [
          {
            key: "sasuke_walk_frame1",
            duration: 300,
          },
          {
            key: "sasuke_walk_frame2",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Jump 动画
    if (!anims.exists("sasuke_jump_up_anim")) {
      anims.create({
        key: "sasuke_jump_up_anim",
        frames: [{ key: "sasuke_jump_frame1", duration: 300 }],
        repeat: 0,
      })
    }

    if (!anims.exists("sasuke_jump_down_anim")) {
      anims.create({
        key: "sasuke_jump_down_anim",
        frames: [{ key: "sasuke_jump_frame2", duration: 400 }],
        repeat: 0,
      })
    }

    // Punch 动画
    if (!anims.exists("sasuke_punch_anim")) {
      anims.create({
        key: "sasuke_punch_anim",
        frames: [
          {
            key: "sasuke_punch_frame1",
            duration: 100,
          },
          {
            key: "sasuke_punch_frame2",
            duration: 150,
          },
        ],
        repeat: 0,
      })
    }

    // Kick 动画
    if (!anims.exists("sasuke_kick_anim")) {
      anims.create({
        key: "sasuke_kick_anim",
        frames: [
          {
            key: "sasuke_kick_frame1",
            duration: 120,
          },
          {
            key: "sasuke_kick_frame2",
            duration: 180,
          },
        ],
        repeat: 0,
      })
    }

    // Chidori 动画 - 蓄力时间优化到0.5秒
    if (!anims.exists("sasuke_chidori_anim")) {
      anims.create({
        key: "sasuke_chidori_anim",
        frames: [
          {
            key: "sasuke_chidori_frame1",
            duration: 250, // 0.25秒
          },
          {
            key: "sasuke_chidori_frame2",
            duration: 250, // 0.25秒，总计0.5秒
          },
        ],
        repeat: 0,
      })
    }

    // Sharingan 动画
    if (!anims.exists("sasuke_sharingan_anim")) {
      anims.create({
        key: "sasuke_sharingan_anim",
        frames: [
          {
            key: "sasuke_sharingan_frame1",
            duration: 400,
          },
          {
            key: "sasuke_sharingan_frame2",
            duration: 300,
          },
        ],
        repeat: 0,
      })
    }

    // Sharingan 召唤动画 - 新增
    if (!anims.exists("sasuke_sharingan_summon_anim")) {
      anims.create({
        key: "sasuke_sharingan_summon_anim",
        frames: [
          {
            key: "sasuke_sharingan_summon",
            duration: 1500,
          },
        ],
        repeat: 0,
      })
    }

    // Die 动画
    if (!anims.exists("sasuke_die_anim")) {
      anims.create({
        key: "sasuke_die_anim",
        frames: [
          {
            key: "sasuke_die_frame1",
            duration: 1000,
          },
          {
            key: "sasuke_die_frame2",
            duration: 2000,
          },
        ],
        repeat: 0,
      })
    }
  }

  update(input, jKey, kKey, lKey, uKey) {
    if (!this.body || !this.active || this.isDead || this.isChidori || this.isSharingan || this.isHurting) {
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
    if (!this.isDead && !this.isPunching && !this.isKicking && !this.isChidori && !this.isSharingan && !this.isHurting) {
      this.handleAttacks(jKey, kKey, lKey, uKey)
    }

    // Handle movement
    if (!this.isDead && !this.isPunching && !this.isKicking && !this.isChidori && !this.isSharingan && !this.isHurting) {
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
      this.play("sasuke_die_anim", true)
      this.resetOriginAndOffset()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "sasuke_die_anim") {
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

      this.play("sasuke_punch_anim", true)
      this.resetOriginAndOffset()
      this.punchSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "sasuke_punch_anim") {
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

      this.play("sasuke_kick_anim", true)
      this.resetOriginAndOffset()
      this.kickSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "sasuke_kick_anim") {
          this.isKicking = false
          this.currentMeleeTargets.clear()
        }
      })
    }

    // 千鸟（L键）
    if (Phaser.Input.Keyboard.JustDown(lKey) && this.canUseChidori()) {
      this.useChidori()
    }

    // 写轮眼（U键）
    if (Phaser.Input.Keyboard.JustDown(uKey) && this.canUseSharingan()) {
      this.useSharingan()
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
        this.play("sasuke_jump_up_anim", true)
        this.resetOriginAndOffset()
      } else {
        this.play("sasuke_jump_down_anim", true)
        this.resetOriginAndOffset()
      }
    } else if (Math.abs(this.body.velocity.x) > 0) {
      this.play("sasuke_walk_anim", true)
      this.resetOriginAndOffset()
    } else {
      this.play("sasuke_idle_anim", true)
      this.resetOriginAndOffset()
    }
  }

  resetOriginAndOffset() {
    // 根据不同动画返回对应的原点数据
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "sasuke_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "sasuke_walk_anim":
          baseOriginX = 0.539;
          baseOriginY = 1.0;
          break;
        case "sasuke_jump_up_anim":
        case "sasuke_jump_down_anim":
          baseOriginX = 0.457;
          baseOriginY = 1.0;
          break;
        case "sasuke_punch_anim":
          baseOriginX = 0.268;
          baseOriginY = 1.0;
          break;
        case "sasuke_kick_anim":
          baseOriginX = 0.395;
          baseOriginY = 1.0;
          break;
        case "sasuke_chidori_anim":
          baseOriginX = 0.224;
          baseOriginY = 1.0;
          break;
        case "sasuke_sharingan_anim":
          baseOriginX = 0.254;
          baseOriginY = 1.0;
          break;
        case "sasuke_sharingan_summon_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "sasuke_die_anim":
          baseOriginX = 0.319;
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
    
    // 设置原点
    this.setOrigin(animOriginX, animOriginY);
    
    this.body.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    );
  }

  // 技能冷却检查
  canUseChidori() {
    return (this.scene.time.now - this.lastChidoriTime) >= this.chidoriCooldown
  }

  canUseSharingan() {
    return (this.scene.time.now - this.lastSharinganTime) >= this.sharinganCooldown
  }

  // 获取冷却剩余时间
  getChidoriCooldownRemaining() {
    return Math.max(0, this.chidoriCooldown - (this.scene.time.now - this.lastChidoriTime))
  }

  getSharinganCooldownRemaining() {
    return Math.max(0, this.sharinganCooldown - (this.scene.time.now - this.lastSharinganTime))
  }

  // 千鸟攻击
  useChidori() {
    this.lastChidoriTime = this.scene.time.now
    this.isChidori = true
    this.body.setVelocityX(0)
    
    this.chidoriSound.play()
    this.play("sasuke_chidori_anim", true)
    this.resetOriginAndOffset()
    
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "sasuke_chidori_anim") {
        this.performChidoriAttack()
        this.isChidori = false
      }
    })
  }

  performChidoriAttack() {
    // 千鸟冲刺攻击
    const dashSpeed = 500
    const dashDistance = 300
    const dashDirection = this.facingDirection === "right" ? 1 : -1
    const targetX = this.x + (dashDirection * dashDistance)
    
    // 播放冲刺音效
    if (this.scene.sound.get("ninja_slash_sound")) {
      this.scene.sound.play("ninja_slash_sound", { volume: 0.4 })
    }
    
    // 创建千鸟冲刺特效轨迹
    this.createChidoriDashEffect()
    
    // 冲刺动画
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 400,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        // 冲刺过程中检测碰撞的敌人
        this.checkChidoriCollision()
      },
      onComplete: () => {
        this.body.setVelocityX(0)
      }
    })
    
    // 屏幕效果
    this.scene.cameras.main.shake(400, 0.008)
  }

  createChidoriDashEffect() {
    // 创建千鸟电光特效
    const lightningCount = 5
    for (let i = 0; i < lightningCount; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const lightning = this.scene.add.image(this.x, this.y - 30, "rasengan_effect")
        lightning.setScale(0.2)
        lightning.setTint(0x00ffff) // 蓝色电光
        lightning.setAlpha(0.8)
        
        this.scene.tweens.add({
          targets: lightning,
          alpha: 0,
          scaleX: 0.4,
          scaleY: 0.4,
          duration: 300,
          onComplete: () => {
            lightning.destroy()
          }
        })
      })
    }
  }

  checkChidoriCollision() {
    // 检查冲刺路径上的敌人
    const dashRange = 80
    const enemies = this.scene.enemies.children.entries.filter(enemy => 
      enemy.active && !enemy.isDead && 
      Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < dashRange &&
      !this.currentMeleeTargets.has(enemy)
    )
    
    enemies.forEach(enemy => {
      this.currentMeleeTargets.add(enemy)
      
      // 千鸟冲刺伤害
      enemy.takeDamage(60)
      
      // 强力击退
      const direction = enemy.x > this.x ? 1 : -1
      enemy.body.setVelocityX(direction * 350)
      enemy.body.setVelocityY(-150)
    })
  }

  // 写轮眼攻击
  useSharingan() {
    const nearestEnemy = this.findNearestEnemy()
    if (!nearestEnemy) return
    
    this.lastSharinganTime = this.scene.time.now
    this.isSharingan = true
    this.body.setVelocityX(0)
    
    this.sharinganSound.play()
    this.play("sasuke_sharingan_summon_anim", true)
    this.resetOriginAndOffset()
    
    const skillDuration = 2500
    const resetSharinganState = () => {
      this.isSharingan = false
      if (this.sharinganEffect) {
        this.sharinganEffect.destroy()
        this.sharinganEffect = null
      }
    }
    
    const failsafeTimer = this.scene.time.delayedCall(skillDuration + 100, resetSharinganState)
    
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "sasuke_sharingan_summon_anim") {
        try {
          this.scene.cameras.main.shake(skillDuration, 0.015)
        } catch (error) {
          console.warn("Failed to shake camera:", error)
        }
        
        if (nearestEnemy && nearestEnemy.active) {
          this.sharinganEffect = this.scene.add.image(nearestEnemy.x, nearestEnemy.y - nearestEnemy.body.height / 2, "sasuke_black_vortex")
          this.sharinganEffect.setScale(0.3)
          this.sharinganEffect.setOrigin(0.5, 0.5)
          
          if (this.scene.tweens && this.sharinganEffect) {
            // 黑色漩涡出现时的动画：从小到大，快速旋转
            this.scene.tweens.add({
              targets: this.sharinganEffect,
              scaleX: 0.5,
              scaleY: 0.5,
              rotation: Math.PI * 6, // 更快的旋转
              duration: 1000,
              ease: 'Power2.easeOut'
            })
            
            // 持续旋转效果
            this.scene.tweens.add({
              targets: this.sharinganEffect,
              rotation: Math.PI * 12, // 持续旋转
              duration: 1500,
              delay: 1000,
              ease: 'Linear'
            })
            
            // 最后消失效果：收缩并淡出
            this.scene.tweens.add({
              targets: this.sharinganEffect,
              scaleX: 0.1,
              scaleY: 0.1,
              alpha: 0,
              rotation: Math.PI * 16, // 消失时快速旋转
              duration: 800,
              delay: 1700,
              ease: 'Power2.easeIn',
              onComplete: () => {
                if (failsafeTimer) failsafeTimer.destroy()
                resetSharinganState()
              }
            })
          }
        }
        
        this.scene.time.delayedCall(1000, () => {
          if (nearestEnemy && nearestEnemy.active && !nearestEnemy.isDead) {
            nearestEnemy.health = 0
            nearestEnemy.isDead = true
            nearestEnemy.body.setVelocityX(0)
            nearestEnemy.play("sound_ninja_die_anim", true)
            nearestEnemy.resetOriginAndOffset()
            nearestEnemy.dieSound.play()
            
            nearestEnemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
              if (animation.key === "sound_ninja_die_anim") {
                nearestEnemy.setActive(false)
                nearestEnemy.setVisible(false)
              }
            })
          }
        })
      }
    })
  }

  findNearestEnemy() {
    const enemies = this.scene.enemies.children.entries.filter(enemy => 
      enemy.active && !enemy.isDead
    )
    
    if (enemies.length === 0) return null
    
    let nearestEnemy = null
    let nearestDistance = Infinity
    
    enemies.forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    })
    
    return nearestEnemy
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

  showDustEffect() {
    // 与卡卡西相同的尘土特效实现
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
    
    this.showDamageNumber(damage)

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
