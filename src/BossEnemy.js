import Phaser from 'phaser'
import { SoundNinja } from './SoundNinja.js'
import { createTrigger } from './utils.js'

/**
 * Level 3 boss. Same visuals as SoundNinja but larger, more health,
 * higher damage, and enrages at low HP (faster movement, shorter attack cooldown).
 */
export class BossEnemy extends SoundNinja {
  constructor(scene, x, y) {
    super(scene, x, y)

    this.isBoss = true
    this.maxHealth = 350
    this.health = 350
    this.enraged = false
    this.enrageThreshold = 0.4

    this.contactDamage = 28
    this.meleeDamage = 25

    this.baseWalkSpeed = 100
    this.rageWalkSpeed = 185
    this.walkSpeed = this.baseWalkSpeed

    this.baseAttackCooldown = 3000
    this.rageAttackCooldown = 1600
    this.attackCooldown = this.baseAttackCooldown

    this.detectionRange = 420
    this.patrolDistance = 280
    this.patrolLeftBound = this.patrolStartX - this.patrolDistance / 2
    this.patrolRightBound = this.patrolStartX + this.patrolDistance / 2

    const standardHeight = 2 * 64
    const baseScale = standardHeight / 560
    this.characterScale = baseScale * 1.35
    this.setScale(this.characterScale)

    this.collisionBoxWidth = 290 * 0.9 * 1.2
    this.collisionBoxHeight = 560 * 0.9 * 1.2
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    this.resetOriginAndOffset()
    this.destroyMeleeTrigger()
    this.createMeleeTrigger()
  }

  destroyMeleeTrigger() {
    if (this.meleeTrigger) {
      this.meleeTrigger.destroy()
      this.meleeTrigger = null
    }
  }

  createMeleeTrigger() {
    this.meleeTrigger = createTrigger(this.scene, 0, 0, 160, 130)
  }

  takeDamage(damage) {
    if (this.isDead) return

    const wasEnraged = this.enraged
    this.health -= damage
    this.health = Math.max(0, this.health)

    if (!wasEnraged && this.health <= this.maxHealth * this.enrageThreshold) {
      this.enraged = true
      this.walkSpeed = this.rageWalkSpeed
      this.attackCooldown = this.rageAttackCooldown
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(200, 0.02)
        this.scene.cameras.main.flash(200, 255, 80, 80, false)
      }
      this.setTint(0xff4444)
      this.scene.time.delayedCall(500, () => {
        if (this.active && !this.isDead) this.clearTint()
      })
    }

    this.isHurting = true
    this.hurtSound.play()
    this.showDamageNumber(damage)
    this.aiState = "chase"

    const shakeIntensity = Math.min(0.02, 0.008 + damage * 0.00015)
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(120, shakeIntensity)
    }
    this.setTint(0xff0000)
    this.scene.time.delayedCall(100, () => {
      if (this.active && !this.isDead) {
        this.clearTint()
      }
    })

    if (this.scene.events) {
      this.scene.events.emit('enemyHit', damage)
    }

    this.scene.time.delayedCall(150, () => {
      this.isHurting = false
    })

    let blinkCount = 0
    this.scene.time.addEvent({
      delay: 50,
      repeat: 5,
      callback: () => {
        this.alpha = this.alpha === 1 ? 0.5 : 1
        blinkCount++
        if (blinkCount >= 6) this.alpha = 1
      }
    })
  }

  updateMeleeTrigger() {
    let triggerX = 0
    let triggerY = 0
    const triggerWidth = 160
    const triggerHeight = 130
    const enemyCenterX = this.x
    const enemyCenterY = this.y - this.body.height / 2

    if (this.facingDirection === "right") {
      triggerX = enemyCenterX + triggerWidth / 2
      triggerY = enemyCenterY
    } else {
      triggerX = enemyCenterX - triggerWidth / 2
      triggerY = enemyCenterY
    }

    this.meleeTrigger.setPosition(triggerX, triggerY)
    this.meleeTrigger.body.setSize(triggerWidth, triggerHeight)
  }
}
