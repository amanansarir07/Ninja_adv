import Phaser from 'phaser'
import { createTrigger } from './utils.js'

export class ToadSummon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "toad_idle_frame1")

   
    scene.add.existing(this)
    scene.physics.add.existing(this)

    
    this.scene = scene
    this.facingDirection = "right"
    this.walkSpeed = 150
    this.maxHealth = 100
    this.health = this.maxHealth
    this.summonDuration = 15000 // 
    this.attackCooldown = 3000 // 
    this.lastAttackTime = 0

    
    this.isDead = false
    this.isAttacking = false
    this.isHurting = false
    this.currentMeleeTargets = new Set()

    // AI状态
    this.aiState = 'hunt' // hunt, attack, patrol, dodge
    this.target = null // 攻击目标
    this.summoner = null // 召唤者（玩家）- 仅用于确定召唤范围
    this.detectionRange = 600 // 检测敌人的范围
    this.maxDistanceFromSummoner = 400 // 距离召唤者的最大距离
    this.huntRange = 500 // 主动寻敌范围
    this.jumpPower = 900 // 跳跃力度 - 增加高度
    this.lastJumpTime = 0 // 上次跳跃时间
    this.jumpCooldown = 800 // 跳跃冷却时间
    this.patrolDirection = 1 // 巡逻方向 (1=右, -1=左)
    this.lastPatrolChangeTime = 0 // 上次改变巡逻方向的时间
    this.patrolChangeInterval = 3000 // 巡逻方向改变间隔
    
    // 方向切换防抖
    this.lastDirectionChangeTime = 0
    this.directionChangeDelay = 300 // 300ms防抖时间（蛤蟆比敌人更灵活）

    // 设置物理属性
    this.body.setGravityY(1200)
    
    // 设置碰撞盒子
    this.collisionBoxWidth = 412 * 0.8
    this.collisionBoxHeight = 560 * 0.8
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // 设置缩放 - 蛤蟆比角色稍大
    const targetHeight = 2.5 * 64 // 2.5个tile高
    this.characterScale = targetHeight / 560
    this.setScale(this.characterScale)

    // 设置初始origin
    this.setOrigin(0.5, 1.0)

    // 创建动画
    this.createAnimations()

    // 播放idle动画
    this.play("toad_idle_anim")
    this.resetOriginAndOffset()

    // 创建攻击触发器
    this.createMeleeTrigger()

    // 设置消失计时器
    this.scene.time.delayedCall(this.summonDuration, () => {
      this.disappear()
    })

    // 召唤特效
    this.createSummonEffect()
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle 动画
    if (!anims.exists("toad_idle_anim")) {
      anims.create({
        key: "toad_idle_anim",
        frames: [
          { key: "toad_idle_frame1", duration: 800 },
          { key: "toad_idle_frame2", duration: 800 },
        ],
        repeat: -1,
      })
    }

    // 🔥 更新Walk动画 - 直接使用完整的idle动画作为行走动画
    if (!anims.exists("toad_walk_anim")) {
      anims.create({
        key: "toad_walk_anim",
        frames: [
          { key: "toad_idle_frame1", duration: 800 },
          { key: "toad_idle_frame2", duration: 800 },
        ],
        repeat: -1,
      })
    }

    // 🔥 新的Attack动画 - 更明确的攻击动作，时长优化
    if (!anims.exists("toad_attack_anim")) {
      anims.create({
        key: "toad_attack_anim",
        frames: [
          { key: "toad_attack_frame1", duration: 150 },
          { key: "toad_attack_frame2", duration: 250 },
        ],
        repeat: 0,
      })
    }
  }

  createSummonEffect() {
    // 召唤烟雾特效
    const smokeEffect = this.scene.add.image(this.x, this.y - 50, "summoning_smoke")
    smokeEffect.setScale(0.3)
    smokeEffect.setAlpha(0.8)
    
    // 烟雾消散动画
    this.scene.tweens.add({
      targets: smokeEffect,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        smokeEffect.destroy()
      }
    })
  }

  createMeleeTrigger() {
    this.meleeTrigger = createTrigger(this.scene, 0, 0, 200, 150)
  }

  updateMeleeTrigger() {
    const toadCenterX = this.x
    const toadCenterY = this.y - this.body.height / 2

    let triggerX = toadCenterX
    let triggerY = toadCenterY

    if (this.facingDirection === "right") {
      triggerX = toadCenterX + 100
    } else {
      triggerX = toadCenterX - 100
    }

    this.meleeTrigger.setPosition(triggerX, triggerY)
    this.meleeTrigger.body.setSize(200, 150)
  }

  resetOriginAndOffset() {
    let baseOriginX = 0.5
    let baseOriginY = 1.0
    
    const currentAnim = this.anims.currentAnim
    if (currentAnim) {
      switch(currentAnim.key) {
        case "toad_idle_anim":
          // 蛤蟆待机动画：412x560，origin: 0.5, 1.0
          baseOriginX = 0.5
          baseOriginY = 1.0
          break
        case "toad_walk_anim":
          // 🔥 蛤蟆行走动画（使用完整idle动画）：412x560，origin: 0.5, 1.0
          baseOriginX = 0.5
          baseOriginY = 1.0
          break
        case "toad_attack_anim":
          // 🔥 新蛤蟆攻击动画：669x631，origin: 0.5, 1.0
          baseOriginX = 0.5
          baseOriginY = 1.0
          break
        default:
          baseOriginX = 0.5
          baseOriginY = 1.0
          break
      }
    }

    let animOriginX = this.facingDirection === "left" ? (1 - baseOriginX) : baseOriginX
    let animOriginY = baseOriginY
    
    this.setOrigin(animOriginX, animOriginY)
    
    this.body.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    )
  }

  setSummoner(summoner) {
    this.summoner = summoner
  }

  update() {
    if (!this.body || !this.active || this.isDead) {
      return
    }

    // 🔥 最优先：更新动画状态，确保攻击动画不被打断
    this.updateAnimations()
    
    // 更新AI行为
    this.updateAI()
    
    // 更新攻击触发器
    this.updateMeleeTrigger()
  }

  updateAI() {
    const currentTime = this.scene.time.now

    // 如果正在攻击，停止所有移动，专心攻击
    if (this.isAttacking) {
      this.body.setVelocityX(0)
      return
    }

    // 检查是否距离召唤者太远，如果太远需要回到范围内
    const distanceFromSummoner = this.summoner ? 
      Phaser.Math.Distance.Between(this.x, this.y, this.summoner.x, this.summoner.y) : 0

    // 寻找最近的敌人（排除召唤者和其他友军）
    let nearestEnemy = null
    let nearestDistance = this.detectionRange

    if (this.scene.enemies) {
      this.scene.enemies.children.entries.forEach(enemy => {
        if (enemy.active && !enemy.isDead && !this.isFriendly(enemy)) {
          const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
          if (distance < nearestDistance) {
            nearestEnemy = enemy
            nearestDistance = distance
          }
        }
      })
    }

    // 检查是否需要躲避
    const shouldDodge = this.shouldDodgeEnemy(nearestEnemy)
    
    // AI状态机 - 优先级：躲避 > 攻击 > 寻敌 > 巡逻 > 返回召唤者
    if (shouldDodge && this.canJump()) {
      // 躲避模式 - 跳跃躲避
      this.performDodgeJump(nearestEnemy)
    } else if (nearestEnemy && nearestDistance <= 200) {
      // 近距离攻击模式
      this.performCombatBehavior(nearestEnemy, nearestDistance, currentTime)
    } else if (nearestEnemy && nearestDistance <= this.huntRange) {
      // 主动寻敌模式 - 积极追击
      this.performAggressiveHunt(nearestEnemy)
    } else if (distanceFromSummoner > this.maxDistanceFromSummoner) {
      // 距离召唤者太远，快速返回
      this.performReturnToSummoner()
    } else {
      // 在召唤者附近巡逻寻敌
      this.performPatrolBehavior(currentTime)
    }
  }

  // 防抖方向切换方法
  changeFacingDirection(newDirection) {
    const currentTime = this.scene.time.now
    if (this.facingDirection !== newDirection && 
        currentTime - this.lastDirectionChangeTime > this.directionChangeDelay) {
      this.facingDirection = newDirection
      this.lastDirectionChangeTime = currentTime
      this.setFlipX(this.facingDirection === "left")
    }
  }

  // 检查是否应该躲避敌人
  shouldDodgeEnemy(enemy) {
    if (!enemy || !this.body.onFloor() || this.isFriendly(enemy)) return false
    
    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
    
    // 如果敌人很近且正在攻击
    if (distance < 120 && enemy.isAttacking) {
      return true
    }
    
    // 如果敌人冲向我们的速度很快
    if (distance < 150 && Math.abs(enemy.body.velocity.x) > 100) {
      const enemyMovingTowardsUs = (enemy.x < this.x && enemy.body.velocity.x > 0) || 
                                   (enemy.x > this.x && enemy.body.velocity.x < 0)
      return enemyMovingTowardsUs
    }
    
    return false
  }

  // 检查是否为友军
  isFriendly(target) {
    if (!target) return false
    
    // 召唤者是友军
    if (target === this.summoner) return true
    
    // 检查是否为玩家角色（通过类名或属性判断）
    if (target.constructor.name.includes('Player')) return true
    
    // 检查是否为其他召唤兽
    if (target.constructor.name === 'ToadSummon') return true
    
    return false
  }

  // 检查是否可以跳跃
  canJump() {
    const currentTime = this.scene.time.now
    return this.body.onFloor() && (currentTime - this.lastJumpTime) > this.jumpCooldown
  }

  // 执行躲避跳跃
  performDodgeJump(enemy) {
    this.lastJumpTime = this.scene.time.now
    this.body.setVelocityY(-this.jumpPower)
    
    // 跳跃时向敌人相反方向移动
    if (enemy) {
      const dodgeDirection = enemy.x > this.x ? -1 : 1
      this.body.setVelocityX(dodgeDirection * this.walkSpeed * 0.8)
      const targetDirection = dodgeDirection > 0 ? "right" : "left"
      this.changeFacingDirection(targetDirection)
    }
    
    this.aiState = 'dodge'
  }

  // 战斗行为
  performCombatBehavior(enemy, distance, currentTime) {
    this.aiState = 'attack'
    this.target = enemy
    
    // 面向敌人 - 使用防抖方向切换
    const targetDirection = enemy.x > this.x ? "right" : "left"
    this.changeFacingDirection(targetDirection)

    // 如果正在攻击，保持静止
    if (this.isAttacking) {
      this.body.setVelocityX(0)
      return
    }

    // 如果可以攻击
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      if (distance <= 80) {
        // 近距离直接攻击
        this.performAttack()
      } else {
        // 稍远距离 - 跳跃攻击
        if (this.canJump() && distance <= 150) {
          this.performJumpAttack(enemy)
        } else {
          // 快速接近
          const directionX = enemy.x > this.x ? 1 : -1
          this.body.setVelocityX(directionX * this.walkSpeed)
        }
      }
    } else {
      // 攻击冷却中，保持适当距离
      if (distance < 60) {
        // 太近了，后退一点
        const directionX = enemy.x > this.x ? -1 : 1
        this.body.setVelocityX(directionX * this.walkSpeed * 0.5)
      } else if (distance > 120) {
        // 太远了，接近一点
        const directionX = enemy.x > this.x ? 1 : -1
        this.body.setVelocityX(directionX * this.walkSpeed * 0.7)
      } else {
        // 保持距离
        this.body.setVelocityX(0)
      }
    }
  }

  // 积极寻敌行为 - 主动跳跃追击
  performAggressiveHunt(enemy) {
    this.aiState = 'hunt'
    this.target = enemy
    
    // 面向敌人 - 使用防抖方向切换
    const targetDirection = enemy.x > this.x ? "right" : "left"
    this.changeFacingDirection(targetDirection)
    
    // 计算到敌人的水平和垂直距离
    const horizontalDistance = Math.abs(enemy.x - this.x)
    const verticalDistance = enemy.y - this.y // 负值表示敌人在上方
    
    // 如果敌人在上方且距离不太远，尝试跳跃接近
    if (verticalDistance < -32 && horizontalDistance < 200 && this.canJump()) {
      this.body.setVelocityY(-this.jumpPower * 0.9)
      this.lastJumpTime = this.scene.time.now
      
      // 跳跃时向敌人方向移动
      const directionX = enemy.x > this.x ? 1 : -1
      this.body.setVelocityX(directionX * this.walkSpeed * 1.1)
    } else {
      // 正常水平追击
      const directionX = enemy.x > this.x ? 1 : -1
      this.body.setVelocityX(directionX * this.walkSpeed * 1.3) // 积极追击时速度更快
      
      // 如果移动受阻（可能有障碍物），尝试跳跃
      if (this.canJump() && Math.abs(this.body.velocity.x) < this.walkSpeed * 0.5) {
        this.body.setVelocityY(-this.jumpPower * 0.7)
        this.lastJumpTime = this.scene.time.now
      }
    }
  }

  // 巡逻行为 - 主动寻找敌人
  performPatrolBehavior(currentTime) {
    this.aiState = 'patrol'
    
    // 定期改变巡逻方向
    if (currentTime - this.lastPatrolChangeTime > this.patrolChangeInterval) {
      this.patrolDirection *= -1 // 改变方向
      this.lastPatrolChangeTime = currentTime
    }
    
    // 面向巡逻方向 - 使用防抖方向切换
    const targetDirection = this.patrolDirection > 0 ? "right" : "left"
    this.changeFacingDirection(targetDirection)
    
    // 巡逻移动
    this.body.setVelocityX(this.patrolDirection * this.walkSpeed * 0.8)
    
    // 巡逻时偶尔跳跃以探索不同高度的敌人
    const jumpChance = Math.random()
    if (this.canJump() && jumpChance < 0.02) { // 2%概率跳跃
      this.body.setVelocityY(-this.jumpPower * 0.6)
      this.lastJumpTime = this.scene.time.now
    }
    
    // 如果碰到边界或移动受阻，改变方向
    if (Math.abs(this.body.velocity.x) < this.walkSpeed * 0.3) {
      this.patrolDirection *= -1
      this.lastPatrolChangeTime = currentTime
    }
  }

  // 返回召唤者行为
  performReturnToSummoner() {
    if (!this.summoner) return
    
    this.aiState = 'return'
    
    const directionX = this.summoner.x > this.x ? 1 : -1
    const targetDirection = directionX > 0 ? "right" : "left"
    this.changeFacingDirection(targetDirection)
    
    // 快速返回
    this.body.setVelocityX(directionX * this.walkSpeed * 1.5)
    
    // 如果召唤者在上方，跳跃接近
    const verticalDistance = this.summoner.y - this.y
    if (verticalDistance < -50 && this.canJump()) {
      this.body.setVelocityY(-this.jumpPower * 0.8)
      this.lastJumpTime = this.scene.time.now
    }
  }

  // 跳跃攻击
  performJumpAttack(enemy) {
    this.lastJumpTime = this.scene.time.now
    this.body.setVelocityY(-this.jumpPower * 0.8)
    
    // 向敌人方向跳跃，但立即进入攻击状态
    const directionX = enemy.x > this.x ? 1 : -1
    this.body.setVelocityX(directionX * this.walkSpeed * 0.6)
    
    // 立即进入攻击状态，防止播放行走动画
    this.isAttacking = true
    this.lastAttackTime = this.scene.time.now
    this.currentMeleeTargets.clear()
    
    // 播放攻击动画
    this.play("toad_attack_anim", true)
    this.resetOriginAndOffset()
    
    // 播放攻击音效
    if (this.scene.sound.get("ninja_slash_sound")) {
      this.scene.sound.play("ninja_slash_sound", { volume: 0.3 })
    }
    
    // 延迟停止移动，让跳跃有一点距离
    this.scene.time.delayedCall(100, () => {
      if (!this.isDead) {
        this.body.setVelocityX(0) // 停止水平移动
      }
    })
    
    // 攻击动画完成后结束攻击状态
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
      if (animation.key === "toad_attack_anim") {
        this.isAttacking = false
        this.currentMeleeTargets.clear()
      }
    })
  }

  // 统一的动画管理方法 - 这是动画状态的唯一控制点
  updateAnimations() {
    // 🔥 最高优先级：如果正在攻击，锁定攻击动画，强制停止移动
    if (this.isAttacking) {
      // 强制停止水平移动
      this.body.setVelocityX(0)
      
      // 确保正在播放攻击动画
      if (!this.anims.isPlaying || this.anims.currentAnim.key !== "toad_attack_anim") {
        this.play("toad_attack_anim", true)
        this.resetOriginAndOffset()
      }
      return
    }
    
    // 如果不在攻击状态，根据速度选择动画
    const currentSpeed = Math.abs(this.body.velocity.x)
    
    if (currentSpeed > 25) {
      // 移动状态：播放行走动画
      this.playWalkAnim()
    } else {
      // 静止状态：播放待机动画
      this.playIdleAnim()
    }
  }

  // 播放动画的辅助方法
  playWalkAnim() {
    if (!this.anims.isPlaying || this.anims.currentAnim.key !== "toad_walk_anim") {
      this.play("toad_walk_anim", true)
      this.resetOriginAndOffset()
    }
  }

  playIdleAnim() {
    if (!this.anims.isPlaying || this.anims.currentAnim.key !== "toad_idle_anim") {
      this.play("toad_idle_anim", true)
      this.resetOriginAndOffset()
    }
  }

  performAttack() {
    this.isAttacking = true
    this.lastAttackTime = this.scene.time.now
    this.body.setVelocityX(0)
    this.currentMeleeTargets.clear()

    this.play("toad_attack_anim", true)
    this.resetOriginAndOffset()

    // 播放攻击音效
    if (this.scene.sound.get("ninja_slash_sound")) {
      this.scene.sound.play("ninja_slash_sound", { volume: 0.3 })
    }

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
      if (animation.key === "toad_attack_anim") {
        this.isAttacking = false
        this.currentMeleeTargets.clear()
      }
    })
  }

  takeDamage(damage) {
    if (this.isDead) return

    this.health -= damage
    if (this.health <= 0) {
      this.health = 0
      this.isDead = true
      this.disappear()
    }
  }

  disappear() {
    // 消失特效
    const smokeEffect = this.scene.add.image(this.x, this.y - 50, "summoning_smoke")
    smokeEffect.setScale(0.3)
    smokeEffect.setAlpha(0.3)
    
    this.scene.tweens.add({
      targets: smokeEffect,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 800,
      onComplete: () => {
        smokeEffect.destroy()
      }
    })

    // 销毁蛤蟆
    if (this.meleeTrigger) {
      this.meleeTrigger.destroy()
    }
    this.destroy()
  }
}
