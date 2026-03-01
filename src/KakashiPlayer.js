import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { kakashiConfig } from './gameConfig.json'

export class KakashiPlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "kakashi_idle_frame1")

    // 添加到场景和物理系统
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 角色属性
    this.scene = scene
    this.facingDirection = "right"
    this.walkSpeed = kakashiConfig.walkSpeed.value
    this.jumpPower = kakashiConfig.jumpPower.value

    // 状态标志
    this.isDead = false // 死亡状态
    this.isPunching = false // 出拳状态
    this.isKicking = false // 踢腿状态
    this.isChidori = false // 千鸟状态
    this.isSharingan = false // 写轮眼状态
    this.isHurting = false // 受伤僵直状态
    this.isInvulnerable = false // 无敌状态
    this.hurtingDuration = kakashiConfig.hurtingDuration.value // 受伤僵直时间
    this.invulnerableTime = kakashiConfig.invulnerableTime.value // 无敌时间
    
    // 攻击目标记录系统
    this.currentMeleeTargets = new Set() // 记录当前攻击已命中的目标

    // 玩家血量系统
    this.maxHealth = kakashiConfig.maxHealth.value
    this.health = this.maxHealth

    // 技能冷却系统
    this.chidoriCooldown = kakashiConfig.chidoriCooldown.value
    this.sharinganCooldown = kakashiConfig.sharinganCooldown.value
    this.lastChidoriTime = 0 // 上次使用千鸟的时间
    this.lastSharinganTime = 0 // 上次使用写轮眼的时间

    // 设置物理属性
    this.body.setGravityY(kakashiConfig.gravityY.value)

    // 根据 idle 动画设置碰撞盒子
    this.collisionBoxWidth = 293 * 0.9
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
    this.play("kakashi_idle_anim")
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
    if (!anims.exists("kakashi_idle_anim")) {
      anims.create({
        key: "kakashi_idle_anim",
        frames: [
          {
            key: "kakashi_idle_frame1",
            duration: 800,
          },
          {
            key: "kakashi_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk 动画
    if (!anims.exists("kakashi_walk_anim")) {
      anims.create({
        key: "kakashi_walk_anim",
        frames: [
          {
            key: "kakashi_walk_frame1",
            duration: 300,
          },
          {
            key: "kakashi_walk_frame2",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Jump Up 动画
    if (!anims.exists("kakashi_jump_up_anim")) {
      anims.create({
        key: "kakashi_jump_up_anim",
        frames: [
          {
            key: "kakashi_jump_frame1",
            duration: 300,
          }
        ],
        repeat: 0,
      })
    }

    // Jump Down 动画
    if (!anims.exists("kakashi_jump_down_anim")) {
      anims.create({
        key: "kakashi_jump_down_anim",
        frames: [
          {
            key: "kakashi_jump_frame2",
            duration: 400,
          }
        ],
        repeat: 0,
      })
    }

    // Punch 动画
    if (!anims.exists("kakashi_punch_anim")) {
      anims.create({
        key: "kakashi_punch_anim",
        frames: [
          {
            key: "kakashi_punch_frame1",
            duration: 100,
          },
          {
            key: "kakashi_punch_frame2",
            duration: 150,
          },
        ],
        repeat: 0,
      })
    }

    // Kick 动画
    if (!anims.exists("kakashi_kick_anim")) {
      anims.create({
        key: "kakashi_kick_anim",
        frames: [
          {
            key: "kakashi_kick_frame1",
            duration: 120,
          },
          {
            key: "kakashi_kick_frame2",
            duration: 180,
          },
        ],
        repeat: 0,
      })
    }

    // Chidori 动画 - 蓄力时间优化到0.5秒
    if (!anims.exists("kakashi_chidori_anim")) {
      anims.create({
        key: "kakashi_chidori_anim",
        frames: [
          {
            key: "kakashi_chidori_frame1",
            duration: 250, // 0.25秒
          },
          {
            key: "kakashi_chidori_frame2",
            duration: 250, // 0.25秒，总计0.5秒
          },
        ],
        repeat: 0,
      })
    }

    // Die 动画
    if (!anims.exists("kakashi_die_anim")) {
      anims.create({
        key: "kakashi_die_anim",
        frames: [
          {
            key: "kakashi_die_frame1",
            duration: 1000,
          },
          {
            key: "kakashi_die_frame2",
            duration: 2000,
          },
        ],
        repeat: 0,
      })
    }

    // Sharingan 动画
    if (!anims.exists("kakashi_sharingan_anim")) {
      anims.create({
        key: "kakashi_sharingan_anim",
        frames: [
          {
            key: "kakashi_sharingan_frame1",
            duration: 400,
          },
          {
            key: "kakashi_sharingan_frame2",
            duration: 300,
          },
        ],
        repeat: 0,
      })
    }
  }

  update(input, jKey, kKey, lKey, uKey) {
    if (!this.body || !this.active || this.isDead || this.isPunching || this.isKicking || this.isChidori || this.isSharingan || this.isHurting) {
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
      this.handleAttacks(input, jKey, kKey, lKey, uKey)
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
      this.play("kakashi_die_anim", true)
      this.resetOriginAndOffset()
      this.dieSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "kakashi_die_anim") {
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

  handleAttacks(input, jKey, kKey, lKey, uKey) {
    // J键出拳攻击
    if (Phaser.Input.Keyboard.JustDown(jKey) && !this.isPunching) {
      // 清空攻击目标记录，开始新的攻击
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isPunching = true
      this.body.setVelocityX(0) // 攻击时停止移动

      this.play("kakashi_punch_anim", true)
      this.resetOriginAndOffset()
      this.punchSound.play()
      
      // 兜底机制：确保出拳状态一定会被重置（动画总时长约150ms）
      const punchFailsafe = this.scene.time.delayedCall(200, () => {
        if (this.isPunching) {
          this.isPunching = false
          this.currentMeleeTargets.clear()
        }
      })
      
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "kakashi_punch_anim") {
          // 清除兜底定时器
          if (punchFailsafe) punchFailsafe.destroy()
          this.isPunching = false
          // 攻击结束时清空目标记录
          this.currentMeleeTargets.clear()
        }
      })
    }

    // K键踢腿攻击
    if (Phaser.Input.Keyboard.JustDown(kKey) && !this.isKicking) {
      // 清空攻击目标记录，开始新的攻击
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isKicking = true
      this.body.setVelocityX(0) // 攻击时停止移动

      this.play("kakashi_kick_anim", true)
      this.resetOriginAndOffset()
      this.kickSound.play()
      
      // 兜底机制：确保踢腿状态一定会被重置（动画总时长约150ms）
      const kickFailsafe = this.scene.time.delayedCall(200, () => {
        if (this.isKicking) {
          this.isKicking = false
          this.currentMeleeTargets.clear()
        }
      })
      
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "kakashi_kick_anim") {
          // 清除兜底定时器
          if (kickFailsafe) kickFailsafe.destroy()
          this.isKicking = false
          // 攻击结束时清空目标记录
          this.currentMeleeTargets.clear()
        }
      })
    }

    // L键千鸟冲刺攻击（加入冷却检查）
    if (Phaser.Input.Keyboard.JustDown(lKey) && !this.isChidori && this.canUseChidori()) {
      this.useChidori()
    }

    // U键写轮眼时空扭曲（加入冷却检查）
    if (Phaser.Input.Keyboard.JustDown(uKey) && !this.isSharingan && this.canUseSharingan()) {
      // 记录使用时间
      this.lastSharinganTime = this.scene.time.now
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

    // 记录起跳前是否在地面上
    const wasOnFloor = this.body.blocked.down
    
    // 跳跃
    if (input.up && this.body.blocked.down) {
      this.body.setVelocityY(-this.jumpPower)
      this.jumpSound.play()
      // 起跳时显示尘土特效
      this.showDustEffect()
    }

    // 检测落地，显示尘土特效
    if (!wasOnFloor && this.body.blocked.down && this.body.velocity.y >= 0) {
      this.showDustEffect()
    }

    // 更新动画
    if (!this.body.blocked.down) {
      if (this.body.velocity.y < 0) {
        // 上升阶段
        this.play("kakashi_jump_up_anim", true)
        this.resetOriginAndOffset()
      } else {
        // 下降阶段
        this.play("kakashi_jump_down_anim", true)
        this.resetOriginAndOffset()
      }
    } else if (Math.abs(this.body.velocity.x) > 0) {
      // 行走
      this.play("kakashi_walk_anim", true)
      this.resetOriginAndOffset()
    } else {
      // 静止
      this.play("kakashi_idle_anim", true)
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
        case "kakashi_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "kakashi_walk_anim":
          baseOriginX = 0.568;
          baseOriginY = 1.0;
          break;
        case "kakashi_jump_up_anim":
        case "kakashi_jump_down_anim":
          baseOriginX = 0.433;
          baseOriginY = 1.0;
          break;
        case "kakashi_punch_anim":
          baseOriginX = 0.272;
          baseOriginY = 1.0;
          break;
        case "kakashi_kick_anim":
          baseOriginX = 0.361;
          baseOriginY = 1.0;
          break;
        case "kakashi_chidori_anim":
          baseOriginX = 0.29;
          baseOriginY = 1.0;
          break;
        case "kakashi_die_anim":
          baseOriginX = 0.454;
          baseOriginY = 1.0;
          break;
        case "kakashi_sharingan_anim":
          baseOriginX = 0.244;
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
    
    // 计算偏移量，使碰撞盒子的 bottomCenter 与动画素材帧的 origin 对齐
    this.body.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    );
  }

  takeDamage(damage) {
    if (this.isInvulnerable || this.isDead) return
    
    this.health -= damage
    this.isHurting = true
    this.isInvulnerable = true
    this.hurtSound.play()

    // 显示掉血数值特效
    this.showDamageNumber(damage)

    // 受伤僵直
    this.scene.time.delayedCall(this.hurtingDuration, () => {
      this.isHurting = false
    })

    // 无敌时间内闪烁效果
    let blinkCount = 0
    const blinkInterval = this.scene.time.addEvent({
      delay: 100,
      repeat: this.invulnerableTime / 100 - 1,
      callback: () => {
        this.alpha = this.alpha === 1 ? 0.5 : 1
        blinkCount++
        if (blinkCount >= this.invulnerableTime / 100) {
          this.alpha = 1
          this.isInvulnerable = false
        }
      }
    })
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
    
    // Visual feedback
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

  // 检查千鸟是否可以使用
  canUseChidori() {
    const currentTime = this.scene.time.now
    return currentTime - this.lastChidoriTime >= this.chidoriCooldown
  }

  // 检查写轮眼是否可以使用
  canUseSharingan() {
    const currentTime = this.scene.time.now
    return currentTime - this.lastSharinganTime >= this.sharinganCooldown
  }

  // 获取千鸟剩余冷却时间
  getChidoriCooldownRemaining() {
    const currentTime = this.scene.time.now
    const remaining = this.chidoriCooldown - (currentTime - this.lastChidoriTime)
    return Math.max(0, remaining)
  }

  // 获取写轮眼剩余冷却时间
  getSharinganCooldownRemaining() {
    const currentTime = this.scene.time.now
    const remaining = this.sharinganCooldown - (currentTime - this.lastSharinganTime)
    return Math.max(0, remaining)
  }

  // 千鸟冲刺攻击
  useChidori() {
    this.lastChidoriTime = this.scene.time.now
    this.currentMeleeTargets.clear()
    this.isChidori = true
    this.body.setVelocityX(0)
    
    this.play("kakashi_chidori_anim", true)
    this.resetOriginAndOffset()
    this.chidoriSound.play()
    
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "kakashi_chidori_anim") {
        this.performChidoriDash()
        this.isChidori = false
      }
    })
  }

  performChidoriDash() {
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
      enemy.takeDamage(50)
      
      // 强力击退
      const direction = enemy.x > this.x ? 1 : -1
      enemy.body.setVelocityX(direction * 350)
      enemy.body.setVelocityY(-150)
    })
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
    // 创建多个小尘土特效，向左右扩散
    const dustCount = 3
    const baseY = this.y
    
    for (let i = 0; i < dustCount; i++) {
      const dustEffect = this.scene.add.image(this.x, baseY, "dust_effect")
      dustEffect.setScale(0.15) // 缩小尺寸，避免遮挡角色
      dustEffect.setOrigin(0.5, 1)
      
      // 随机偏移位置
      const offsetX = (Math.random() - 0.5) * 80 // 左右随机偏移
      const offsetY = Math.random() * 10 // 轻微垂直偏移
      dustEffect.x += offsetX
      dustEffect.y += offsetY
      
      // 添加到数组
      this.dustEffects.push(dustEffect)
      
      // 尘土特效渐隐和扩散动画
      this.scene.tweens.add({
        targets: dustEffect,
        alpha: 0,
        scaleX: dustEffect.scaleX * 1.5, // 扩散效果
        scaleY: dustEffect.scaleY * 1.5,
        x: dustEffect.x + (offsetX > 0 ? 30 : -30), // 继续向两边扩散
        duration: 600,
        onComplete: () => {
          if (dustEffect) {
            dustEffect.destroy()
            // 从数组中移除
            const index = this.dustEffects.indexOf(dustEffect)
            if (index > -1) {
              this.dustEffects.splice(index, 1)
            }
          }
        }
      })
    }
  }

  // 写轮眼时空扭曲攻击
  useSharingan() {
    // 寻找最近的敌人
    const nearestEnemy = this.findNearestEnemy()
    if (!nearestEnemy) return // 没有敌人时不执行
    
    this.isSharingan = true
    this.body.setVelocityX(0) // 使用写轮眼时停止移动
    
    // 播放写轮眼音效
    this.sharinganSound.play()
    
    // 播放写轮眼前摇动画
    this.play("kakashi_sharingan_anim", true)
    this.resetOriginAndOffset()
    
    // 设置技能总持续时间为2500ms，确保状态一定会被重置
    const skillDuration = 2500
    const resetSharinganState = () => {
      this.isSharingan = false
      // 清理特效
      if (this.sharinganEffect) {
        this.sharinganEffect.destroy()
        this.sharinganEffect = null
      }
      // 恢复相机跟随
      if (this.scene && this.scene.cameras && this.scene.cameras.main && this.active) {
        try {
          this.scene.cameras.main.stopFollow()
          this.scene.cameras.main.startFollow(this)
        } catch (error) {
          console.warn("Failed to restore camera follow:", error)
        }
      }
    }
    
    // 设置兜底的状态重置，确保无论如何都会重置状态
    const failsafeTimer = this.scene.time.delayedCall(skillDuration + 100, resetSharinganState)
    
    // 动画播放完后开始时空扭曲
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "kakashi_sharingan_anim") {
        // 检查场景和相机是否仍然有效
        if (!this.scene || !this.scene.cameras || !this.scene.cameras.main || !this.active) {
          resetSharinganState()
          return
        }
        
        // VFX特效和抖动同时开始
        // 写轮眼技能屏幕抖动效果
        try {
          this.scene.cameras.main.shake(skillDuration, 0.015)
        } catch (error) {
          console.warn("Failed to shake camera:", error)
        }
        
        // 在敌人位置创建时空扭曲特效
        if (nearestEnemy && nearestEnemy.active) {
          this.sharinganEffect = this.scene.add.image(nearestEnemy.x, nearestEnemy.y - nearestEnemy.body.height / 2, "red_sharingan_distortion")
          this.sharinganEffect.setScale(0.4)
          this.sharinganEffect.setOrigin(0.5, 0.5)
        } else {
          // 如果敌人无效，技能结束
          resetSharinganState()
          if (failsafeTimer) failsafeTimer.destroy()
          return
        }
        
        // 旋转和脉动动画
        if (this.scene.tweens && this.sharinganEffect) {
          this.scene.tweens.add({
            targets: this.sharinganEffect,
            rotation: Math.PI * 4, // 旋转两圈
            scaleX: 0.6,
            scaleY: 0.6,
            duration: 1500,
            ease: 'Power2.easeInOut'
          })
          
          // 渐隐动画，与技能总时间同步
          this.scene.tweens.add({
            targets: this.sharinganEffect,
            alpha: 0,
            duration: 2000,
            delay: 500,
            onComplete: () => {
              // 移除兜底定时器
              if (failsafeTimer) failsafeTimer.destroy()
              // 正常结束时重置状态
              resetSharinganState()
            }
          })
        }
        
        // 延迟执行敌人死亡（时空扭曲需要时间）
        this.scene.time.delayedCall(1000, () => {
          if (nearestEnemy && nearestEnemy.active && !nearestEnemy.isDead) {
            // 直接杀死敌人，不造成常规伤害
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

  // 寻找最近的敌人
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

  // 显示掉血数值特效
  showDamageNumber(damage) {
    // 计算显示位置（角色右上角）
    const offsetX = 40 + Math.random() * 20 // 右上角位置，加上随机偏移
    const offsetY = -60 - Math.random() * 20 // 上方位置，加上随机偏移
    
    // 玩家受伤显示为红色
    const color = '#ff3333'
    const fontSize = '28px'
    
    // 创建伤害数字文本
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
    
    // 添加弹跳和渐隐动画
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 80, // 向上飞
      x: damageText.x + (Math.random() - 0.5) * 40, // 轻微左右飘动
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => {
        damageText.destroy()
      }
    })
    
    // 额外的弹跳效果
    this.scene.tweens.add({
      targets: damageText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    })
  }

  // 重写destroy方法，确保清理所有状态和特效
  destroy(fromScene) {
    // 重置所有状态标志
    this.isDead = false
    this.isPunching = false
    this.isKicking = false
    this.isChidori = false
    this.isSharingan = false
    this.isHurting = false
    this.isInvulnerable = false
    
    // 清理特效
    if (this.dustEffects && this.dustEffects.length > 0) {
      this.dustEffects.forEach(effect => {
        if (effect && effect.destroy) {
          effect.destroy()
        }
      })
      this.dustEffects = []
    }
    
    if (this.sharinganEffect) {
      this.sharinganEffect.destroy()
      this.sharinganEffect = null
    }
    
    // 清理攻击触发器
    if (this.meleeTrigger) {
      this.meleeTrigger.destroy()
      this.meleeTrigger = null
    }
    
    // 调用父类的destroy方法
    super.destroy(fromScene)
  }
}
