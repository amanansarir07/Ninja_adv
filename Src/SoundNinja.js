import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { soundNinjaConfig } from './gameConfig.json'

export class SoundNinja extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "sound_ninja_idle_frame1")

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.scene = scene
    this.facingDirection = "left"
    this.walkSpeed = soundNinjaConfig.walkSpeed.value
    this.patrolStartX = x
    this.patrolDistance = soundNinjaConfig.patrolDistance.value
    this.patrolLeftBound = this.patrolStartX - this.patrolDistance / 2
    this.patrolRightBound = this.patrolStartX + this.patrolDistance / 2

    this.aiState = "patrol"
    this.detectionRange = soundNinjaConfig.detectionRange.value
    this.lastAttackTime = 0
    this.attackCooldown = soundNinjaConfig.attackCooldown.value
    this.lastJumpTime = 0
    this.jumpCooldown = 1200
    this.jumpPower = 580
    this.lastJumpX = x
    this.consecutiveJumpAttempts = 0
    this.maxConsecutiveJumpAttempts = 2
    this.minJumpProgressDistance = 16

    this.isDead = false
    this.isAttacking = false
    this.isHurting = false
    
    this.currentMeleeTargets = new Set()
    this.lastDirectionChangeTime = 0
    this.directionChangeDelay = 500
    this.maxHealth = soundNinjaConfig.maxHealth.value
    this.health = this.maxHealth
    this.baseContactDamage = 14
    this.contactDamage = this.baseContactDamage
    this.baseMeleeDamage = 12
    this.meleeDamage = this.baseMeleeDamage

    this.body.setGravityY(1200)
    this.collisionBoxWidth = 290 * 0.9
    this.collisionBoxHeight = 560 * 0.9
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    const standardHeight = 2 * 64
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    this.setOrigin(0.5, 1.0)
    this.createAnimations()
    this.play("sound_ninja_idle_anim")
    this.resetOriginAndOffset()
    this.createMeleeTrigger()
    this.initializeSounds()
  }

  initializeSounds() {
    this.attackSound = this.scene.sound.add("ninja_slash_sound", { volume: 0.3 })
    this.hurtSound = this.scene.sound.add("ninja_hurt_sound", { volume: 0.3 })
    this.dieSound = this.scene.sound.add("ninja_die_sound", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    if (!anims.exists("sound_ninja_idle_anim")) {
      anims.create({
        key: "sound_ninja_idle_anim",
        frames: [
          {
            key: "sound_ninja_idle_frame1",
            duration: 800,
          },
          {
            key: "sound_ninja_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    if (!anims.exists("sound_ninja_walk_anim")) {
      anims.create({
        key: "sound_ninja_walk_anim",
        frames: [
          {
            key: "sound_ninja_walk_frame1",
            duration: 300,
          },
          {
            key: "sound_ninja_walk_frame2",
            duration: 300,
          },
          {
            key: "sound_ninja_walk_frame3",
            duration: 300,
          },
          {
            key: "sound_ninja_walk_frame4",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    if (!anims.exists("sound_ninja_attack_anim")) {
      anims.create({
        key: "sound_ninja_attack_anim",
        frames: [
          {
            key: "sound_ninja_attack_frame1",
            duration: 50,
          },
          {
            key: "sound_ninja_attack_frame2",
            duration: 100,
          },
        ],
        repeat: 0,
      })
    }

    if (!anims.exists("sound_ninja_die_anim")) {
      anims.create({
        key: "sound_ninja_die_anim",
        frames: [
          {
            key: "sound_ninja_die_frame1",
            duration: 500,
          },
          {
            key: "sound_ninja_die_frame2",
            duration: 1000,
          },
        ],
        repeat: 0,
      })
    }
  }

  update() {
    if (!this.body || !this.active || this.isDead || this.isAttacking || this.isHurting) {
      this.updateMeleeTrigger()
      return
    }

    if (!this.isDead) this.handleDying()
    if (!this.isDead && !this.isAttacking && !this.isHurting) this.handleAI()
    this.updateMeleeTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.play("sound_ninja_die_anim", true)
      this.resetOriginAndOffset()
      this.dieSound.play()

      if (this.scene.spawnSavedCreatureEffect) {
        this.scene.spawnSavedCreatureEffect(this.x, this.y - 40)
      }
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
        if (animation.key === "sound_ninja_die_anim") {
          this.setActive(false)
        }
      })
    } else if(this.y > this.scene.mapHeight + 100 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.setActive(false)
    }
  }

  handleAI() {
    const player = this.scene.player
    if (!player || player.isDead) return

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    switch (this.aiState) {
      case "patrol":
        this.handlePatrol()
        if (distanceToPlayer <= this.detectionRange) {
          this.aiState = "chase"
        }
        break
        
      case "chase":
        this.handleChase(player)
        if (distanceToPlayer <= 80 && this.canAttack() && this.canUseMeleeOnPlayer(player)) {
          this.aiState = "attack"
        } else if (distanceToPlayer > this.detectionRange * 1.5) {
          this.aiState = "patrol"
        }
        break
        
      case "attack":
        this.handleAttack()
        break
    }
    this.setFlipX(this.facingDirection === "left")
  }

  canUseMeleeOnPlayer(player) {
    if (!player) return false
    const horizontalGap = Math.abs(player.x - this.x)
    const verticalGap = Math.abs(player.y - this.y)
    // Prevent fake "stuck" behavior: don't start melee if target is on another platform height.
    return horizontalGap <= 95 && verticalGap <= 42
  }

  changeFacingDirection(newDirection) {
    const currentTime = this.scene.time.now
    if (this.facingDirection !== newDirection && 
        currentTime - this.lastDirectionChangeTime > this.directionChangeDelay) {
      this.facingDirection = newDirection
      this.lastDirectionChangeTime = currentTime
    }
  }

  handlePatrol() {
    if (this.facingDirection === "left" && this.x <= this.patrolLeftBound) {
      this.changeFacingDirection("right")
    } else if (this.facingDirection === "right" && this.x >= this.patrolRightBound) {
      this.changeFacingDirection("left")
    }
    const velocity = this.facingDirection === "left" ? -this.walkSpeed * 0.5 : this.walkSpeed * 0.5
    this.body.setVelocityX(velocity)
    this.play("sound_ninja_walk_anim", true)
    this.resetOriginAndOffset()
  }

  handleChase(player) {
    const targetDirection = player.x < this.x ? "left" : "right"
    this.changeFacingDirection(targetDirection)
    
    const velocityX = this.facingDirection === "left" ? -this.walkSpeed : this.walkSpeed
    this.body.setVelocityX(velocityX)
    this.tryJumpTowardTarget(player)
    this.play("sound_ninja_walk_anim", true)
    this.resetOriginAndOffset()
  }

  tryJumpTowardTarget(player) {
    if (!this.body || !player || player.isDead) return

    const now = this.scene.time.now
    if (now - this.lastJumpTime < this.jumpCooldown) return

    const isGrounded = this.body.blocked.down || this.body.touching.down
    if (!isGrounded) return

    const dx = player.x - this.x
    const dy = this.y - player.y
    const horizontalDistance = Math.abs(dx)
    const movingRight = this.facingDirection === "right"
    const movingTowardPlayer = (movingRight && dx > 8) || (!movingRight && dx < -8)

    // Jump only when player is actually above and in reachable horizontal range.
    const playerIsAbove = dy > 44 && dy < 240
    const playerWithinJumpReach = horizontalDistance > 28 && horizontalDistance < 220

    const blockedAhead = movingRight ? this.body.blocked.right : this.body.blocked.left

    // "Stair jump": player above. "Obstacle jump": blocked while chasing toward player.
    const shouldJumpForHeight = movingTowardPlayer && playerIsAbove && playerWithinJumpReach
    const shouldJumpForObstacle =
      movingTowardPlayer &&
      blockedAhead &&
      horizontalDistance < 180 &&
      Math.abs(this.y - player.y) < 110

    if (!shouldJumpForHeight && !shouldJumpForObstacle) return

    const movedSinceLastJump = Math.abs(this.x - this.lastJumpX)
    if (movedSinceLastJump < this.minJumpProgressDistance) {
      this.consecutiveJumpAttempts += 1
    } else {
      this.consecutiveJumpAttempts = 0
    }

    // Prevent continuous hopping at the same spot.
    if (this.consecutiveJumpAttempts >= this.maxConsecutiveJumpAttempts) {
      this.lastJumpTime = now
      return
    }

    this.body.setVelocityY(-this.jumpPower)
    this.lastJumpTime = now
    this.lastJumpX = this.x
  }

  handleAttack() {
    if (!this.canAttack()) {
      this.aiState = "chase"
      return
    }

    this.currentMeleeTargets.clear()
    this.updateMeleeTrigger()
    this.isAttacking = true
    this.body.setVelocityX(0)

    this.play("sound_ninja_attack_anim", true)
    this.resetOriginAndOffset()
    this.attackSound.play()
    
    this.lastAttackTime = this.scene.time.now

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
      if (animation.key === "sound_ninja_attack_anim") {
        this.isAttacking = false
        this.aiState = "chase"
        this.currentMeleeTargets.clear()
      }
    })
  }

  canAttack() {
    return this.scene.time.now - this.lastAttackTime >= this.attackCooldown
  }

  resetOriginAndOffset() {
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "sound_ninja_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "sound_ninja_walk_anim":
          baseOriginX = 0.556;
          baseOriginY = 1.0;
          break;
        case "sound_ninja_attack_anim":
          baseOriginX = 0.272;
          baseOriginY = 1.0;
          break;
        case "sound_ninja_die_anim":
          baseOriginX = 0.363;
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

  takeDamage(damage) {
    if (this.isDead) return
    
    this.health -= damage
    this.isHurting = true
    this.hurtSound.play()

    this.showDamageNumber(damage)
    this.aiState = "chase"
    
    // Screen shake on hit - intensity based on damage
    const shakeIntensity = Math.min(0.015, 0.005 + damage * 0.0002)
    this.scene.cameras.main.shake(100, shakeIntensity)
    
    // Red tint flash effect
    this.setTint(0xff0000)
    this.scene.time.delayedCall(80, () => {
      if (this.active && !this.isDead) {
        this.clearTint()
      }
    })
    
    // Emit combo event for UI tracking
    if (this.scene.events) {
      this.scene.events.emit('enemyHit', damage)
    }
    
    this.scene.time.delayedCall(100, () => {
      this.isHurting = false
    })
    let blinkCount = 0
    this.scene.time.addEvent({
      delay: 50,
      repeat: 5,
      callback: () => {
        this.alpha = this.alpha === 1 ? 0.5 : 1
        blinkCount++
        if (blinkCount >= 6) {
          this.alpha = 1
        }
      }
    })
  }

  createMeleeTrigger() {
    this.meleeTrigger = createTrigger(this.scene, 0, 0, 120, 100)
  }

  updateMeleeTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 120
    let triggerHeight = 100

    const enemyCenterX = this.x
    const enemyCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerX = enemyCenterX + triggerWidth / 2
        triggerY = enemyCenterY
        break;
      case "left":
        triggerX = enemyCenterX - triggerWidth / 2
        triggerY = enemyCenterY
        break;
    }
    
    this.meleeTrigger.setPosition(triggerX, triggerY)
    this.meleeTrigger.body.setSize(triggerWidth, triggerHeight)
  }

  showDamageNumber(damage) {
    const offsetX = 40 + Math.random() * 20
    const offsetY = -60 - Math.random() * 20
    let color = '#ffffff'
    let fontSize = '24px'
    if (damage >= 50) {
      color = '#ff0000'
      fontSize = '32px'
    } else if (damage >= 30) {
      color = '#ffaa00'
      fontSize = '28px'
    } else {
      color = '#ffff00'
      fontSize = '24px'
    }
    const damageText = this.scene.add.text(
      this.x + offsetX,
      this.y + offsetY,
      `-${damage}`,
      {
        fontFamily: 'RetroPixel, monospace',
        fontSize: fontSize,
        fill: color,
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 3,
          fill: true
        }
      }
    ).setOrigin(0.5, 0.5)
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 80,
      x: damageText.x + (Math.random() - 0.5) * 40,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => damageText.destroy()
    })
    this.scene.tweens.add({
      targets: damageText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    })
  }
}
