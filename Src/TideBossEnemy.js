import { BossEnemy } from './BossEnemy.js'

export class TideBossEnemy extends BossEnemy {
  constructor(scene, x, y) {
    super(scene, x, y)

    this.baseMaxHealth = 260
    this.maxHealth = this.baseMaxHealth
    this.health = this.maxHealth

    this.baseWalkSpeed = 98
    this.walkSpeed = this.baseWalkSpeed
    this.baseAttackCooldown = 2700
    this.attackCooldown = this.baseAttackCooldown

    this.baseContactDamage = 20
    this.contactDamage = this.baseContactDamage
    this.baseMeleeDamage = 18
    this.meleeDamage = this.baseMeleeDamage

    this.baseDetectionRange = 380
    this.detectionRange = this.baseDetectionRange

    this.whirlpoolCooldown = 6200
    this.lastWhirlpoolTime = 0
    this.whirlpoolRadius = 180
    this.whirlpoolPullStrength = 20
    this.whirlpoolDamage = 24
    this.setTint(0x77ccff)
  }

  update() {
    super.update()
    if (!this.active || this.isDead) return
    if (this.aiState !== 'chase' && this.aiState !== 'attack') return
    if (!this.scene.player || this.scene.player.isDead) return

    const now = this.scene.time.now
    if (now - this.lastWhirlpoolTime >= this.whirlpoolCooldown) {
      this.lastWhirlpoolTime = now
      this.castWhirlpool()
    }
  }

  castWhirlpool() {
    const centerX = this.x
    const centerY = this.y - 40
    const pulse = this.scene.add.circle(centerX, centerY, this.whirlpoolRadius, 0x33aaff, 0.15)
    pulse.setDepth(2590)

    this.scene.tweens.add({
      targets: pulse,
      alpha: 0.35,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 380,
      yoyo: true,
      repeat: 4
    })

    let ticks = 0
    const pullEvent = this.scene.time.addEvent({
      delay: 170,
      repeat: 12,
      callback: () => {
        ticks += 1
        const player = this.scene.player
        if (!player || player.isDead || !player.body) return

        const dx = centerX - player.x
        const dy = centerY - player.y
        const dist = Math.max(1, Math.hypot(dx, dy))
        if (dist > this.whirlpoolRadius) return

        const pull = this.whirlpoolPullStrength * (1 - dist / this.whirlpoolRadius)
        player.body.setVelocity(
          player.body.velocity.x + (dx / dist) * pull,
          player.body.velocity.y + (dy / dist) * pull
        )

        if (ticks === 11 && dist < 92 && !player.isInvulnerable && !player.isHurting && !player.isDead) {
          player.takeDamage(this.whirlpoolDamage)
        }
      }
    })

    this.scene.time.delayedCall(2100, () => {
      pullEvent.remove()
      pulse.destroy()
    })
  }
}
