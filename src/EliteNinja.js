import { SoundNinja } from './SoundNinja.js'

export class EliteNinja extends SoundNinja {
  constructor(scene, x, y) {
    super(scene, x, y)

    this.baseMaxHealth = 84
    this.maxHealth = this.baseMaxHealth
    this.health = this.maxHealth

    this.baseWalkSpeed = 100
    this.walkSpeed = this.baseWalkSpeed

    this.baseAttackCooldown = 3200
    this.attackCooldown = this.baseAttackCooldown

    this.baseDetectionRange = 360
    this.detectionRange = this.baseDetectionRange

    this.baseContactDamage = 26
    this.contactDamage = this.baseContactDamage

    this.baseMeleeDamage = 22
    this.meleeDamage = this.baseMeleeDamage

    this.setScale(this.characterScale * 1.12)
    this.setTint(0xffd9a3)
  }
}
