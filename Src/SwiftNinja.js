import { SoundNinja } from './SoundNinja.js'

export class SwiftNinja extends SoundNinja {
  constructor(scene, x, y) {
    super(scene, x, y)

    this.baseMaxHealth = 28
    this.maxHealth = this.baseMaxHealth
    this.health = this.maxHealth

    this.baseWalkSpeed = 175
    this.walkSpeed = this.baseWalkSpeed

    this.baseAttackCooldown = 2600
    this.attackCooldown = this.baseAttackCooldown

    this.baseDetectionRange = 360
    this.detectionRange = this.baseDetectionRange

    this.baseContactDamage = 16
    this.contactDamage = this.baseContactDamage

    this.baseMeleeDamage = 14
    this.meleeDamage = this.baseMeleeDamage

    this.setScale(this.characterScale * 0.92)
  }
}
