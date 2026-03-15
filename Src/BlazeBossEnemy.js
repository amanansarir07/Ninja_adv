import Phaser from 'phaser'
import { BossEnemy } from './BossEnemy.js'

export class BlazeBossEnemy extends BossEnemy {
  constructor(scene, x, y) {
    super(scene, x, y)

    this.baseMaxHealth = 280
    this.maxHealth = this.baseMaxHealth
    this.health = this.maxHealth

    this.baseWalkSpeed = 108
    this.walkSpeed = this.baseWalkSpeed
    this.baseAttackCooldown = 3000
    this.attackCooldown = this.baseAttackCooldown

    this.baseContactDamage = 22
    this.contactDamage = this.baseContactDamage
    this.baseMeleeDamage = 20
    this.meleeDamage = this.baseMeleeDamage

    this.baseDetectionRange = 360
    this.detectionRange = this.baseDetectionRange

    this.lavaBurstCooldown = 5600
    this.lastLavaBurstTime = 0
    this.lavaBurstRadius = 100
    this.lavaBurstDamage = 30
    this.setTint(0xffaa66)
  }

  update() {
    super.update()
    if (!this.active || this.isDead) return
    if (this.aiState !== 'chase' && this.aiState !== 'attack') return
    if (!this.scene.player || this.scene.player.isDead) return

    const now = this.scene.time.now
    if (now - this.lastLavaBurstTime >= this.lavaBurstCooldown) {
      this.lastLavaBurstTime = now
      this.castLavaBurst()
    }
  }

  castLavaBurst() {
    const player = this.scene.player
    const predictedX = player.x + Phaser.Math.Clamp(player.body?.velocity?.x || 0, -180, 180) * 0.22
    const targetX = Phaser.Math.Clamp(predictedX, 64, this.scene.mapWidth - 64)
    const targetY = player.y - 26

    const warning = this.scene.add.circle(targetX, targetY, this.lavaBurstRadius, 0xff5500, 0.2)
    warning.setDepth(2600)
    const core = this.scene.add.circle(targetX, targetY, 20, 0xffdd66, 0.35)
    core.setDepth(2601)

    this.scene.tweens.add({
      targets: [warning, core],
      alpha: 0.75,
      duration: 650,
      yoyo: true,
      repeat: 0
    })

    this.scene.time.delayedCall(850, () => {
      if (!this.active || this.isDead) {
        warning.destroy()
        core.destroy()
        return
      }

      if (this.scene.cameras?.main) {
        this.scene.cameras.main.shake(140, 0.008)
        this.scene.cameras.main.flash(120, 255, 120, 60, false)
      }

      const burst = this.scene.add.circle(targetX, targetY, this.lavaBurstRadius, 0xff4500, 0.4)
      burst.setDepth(2602)
      this.scene.tweens.add({
        targets: burst,
        alpha: 0,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 260,
        onComplete: () => burst.destroy()
      })

      const distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY)
      if (distance <= this.lavaBurstRadius && !player.isInvulnerable && !player.isHurting && !player.isDead) {
        const dir = player.x < targetX ? -1 : 1
        player.body?.setVelocityX(dir * 240)
        player.takeDamage(this.lavaBurstDamage)
      }

      warning.destroy()
      core.destroy()
    })
  }
}
