import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class UIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "UIScene",
    })
  }

  create() {
    this.createHealthBar()
    this.createOxygenBar()
    this.createLevelDisplay()
    this.createPauseButton()
    this.createControlsHint()
    this.createSkillCooldownDisplay()
    this.createSavedCounter()
    this.createComboCounter()
    this.gameScene = this.getCurrentGameScene()
    this.setupComboListener()
  }

  createSavedCounter() {
    this.savedText = this.add.text(230, 24, 'Saved: 0', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '14px',
      fill: '#4dff88'
    })
  }

  createOxygenBar() {
    const screenWidth = screenSize.width.value
    this.oxygenBarBg = this.add.graphics()
    this.oxygenBarBg.fillStyle(0x000000, 0.5)
    this.oxygenBarBg.fillRect(20, 48, 200, 12)
    this.oxygenBar = this.add.graphics()
    this.oxygenText = this.add.text(25, 48, 'O2', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '10px',
      fill: '#87ceeb'
    })
  }

  updateOxygenBar(oxygenPercentage) {
    if (!this.oxygenBar) return
    this.oxygenBar.clear()
    let color = 0x87ceeb
    if (oxygenPercentage < 30) color = 0xff6666
    else if (oxygenPercentage < 60) color = 0xffaa66
    
    this.oxygenBar.fillStyle(color)
    this.oxygenBar.fillRect(42, 50, (176 * oxygenPercentage / 100), 8)
  }

  createComboCounter() {
    const screenWidth = screenSize.width.value
    this.comboCount = 0
    this.comboTimer = null
    this.comboText = this.add.text(screenWidth / 2, 80, '', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '28px',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5)
    this.comboText.setAlpha(0)
  }

  setupComboListener() {
    const scenes = ['Level1Scene', 'Level2Scene', 'Level3Scene']
    scenes.forEach(sceneKey => {
      const scene = this.scene.get(sceneKey)
      if (scene && scene.events) {
        scene.events.on('enemyHit', this.addCombo, this)
      }
    })
  }

  addCombo(damage) {
    this.comboCount++
    
    if (this.comboTimer) {
      this.comboTimer.remove()
    }
    
    this.comboText.setText(this.comboCount + ' HITS!')
    this.comboText.setAlpha(1)
    this.comboText.setScale(1.3)
    
    this.tweens.add({
      targets: this.comboText,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Back.easeOut'
    })
    
    let color = '#ffff00'
    if (this.comboCount >= 10) color = '#ff3333'
    else if (this.comboCount >= 5) color = '#ff9900'
    this.comboText.setFill(color)
    
    this.comboTimer = this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.comboCount = 0
        }
      })
    })
  }

  createHealthBar() {
    const screenWidth = screenSize.width.value
    this.healthBarBg = this.add.graphics()
    this.healthBarBg.fillStyle(0x000000, 0.5)
    this.healthBarBg.fillRect(20, 20, 200, 20)
    this.healthBar = this.add.graphics()
    try {
      this.healthText = this.add.text(25, 22, 'HEALTH', {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '16px',
        fill: '#ffffff'
      })
    } catch (error) {
      console.warn('Error creating health text:', error)
      this.healthText = this.add.text(25, 22, 'HEALTH', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fill: '#ffffff'
      })
    }
  }

  createLevelDisplay() {
    const screenWidth = screenSize.width.value
    if (this.levelText && this.levelText.destroy) {
      this.levelText.destroy()
      this.levelText = null
    }
    
    const currentLevel = this.getCurrentLevelNumber()
    const levelDisplayName = this.getLevelDisplayName(currentLevel)
    try {
      this.levelText = this.add.text(screenWidth / 2, 25, 
        levelDisplayName, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating level text with RetroPixel font:', error)
      this.levelText = this.add.text(screenWidth / 2, 25, 
        levelDisplayName, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5, 0.5)
    }
    
    console.log('Level display created:', this.levelText ? 'success' : 'failed')
  }

  createPauseButton() {
    const screenWidth = screenSize.width.value
    const buttonBg = this.add.graphics()
    buttonBg.fillStyle(0x333333, 0.8)
    buttonBg.fillRoundedRect(-40, -20, 80, 40, 8)
    buttonBg.lineStyle(2, 0x666666, 1)
    buttonBg.strokeRoundedRect(-40, -20, 80, 40, 8)
    buttonBg.setPosition(screenWidth - 60, 50)
    let buttonText
    try {
      buttonText = this.add.text(screenWidth - 60, 50, 'PAUSE', {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '14px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating pause button text:', error)
      buttonText = this.add.text(screenWidth - 60, 50, 'PAUSE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    }
    const buttonZone = this.add.zone(screenWidth - 60, 50, 80, 40)
    buttonZone.setInteractive()
      .on('pointerdown', () => this.pauseGame())
      .on('pointerover', () => {
        buttonBg.clear()
        buttonBg.fillStyle(0x4a90e2, 0.9)
        buttonBg.fillRoundedRect(-40, -20, 80, 40, 8)
        buttonBg.lineStyle(2, 0x6bb6ff, 1)
        buttonBg.strokeRoundedRect(-40, -20, 80, 40, 8)
        buttonText.setFill('#ffff00')
        
        this.tweens.add({
          targets: [buttonBg, buttonText],
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Back.easeOut'
        })
      })
      .on('pointerout', () => {
        buttonBg.clear()
        buttonBg.fillStyle(0x333333, 0.8)
        buttonBg.fillRoundedRect(-40, -20, 80, 40, 8)
        buttonBg.lineStyle(2, 0x666666, 1)
        buttonBg.strokeRoundedRect(-40, -20, 80, 40, 8)
        buttonText.setFill('#ffffff')
        
        this.tweens.add({
          targets: [buttonBg, buttonText],
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Back.easeOut'
        })
      })
    this.pauseButton = {
      buttonBg: buttonBg,
      buttonText: buttonText,
      zone: buttonZone
    }
  }

  pauseGame() {
    if (this.sound.get("ui_click_sound")) this.sound.play("ui_click_sound", { volume: 0.3 })
    const gameScene = this.getCurrentGameScene()
    if (gameScene) {
      this.scene.pause(gameScene.scene.key)
      this.scene.launch("PauseUIScene", { 
        currentLevelKey: gameScene.scene.key 
      })
    }
  }

  createControlsHint() {
    const screenWidth = screenSize.width.value
    const controlsX = screenWidth - 20
    const controlsStartY = 100
    const lineHeight = 25
    const fontSize = '14px'
    const controls = [
      'WASD / Arrows: Move',
      'J: Punch   K: Kick',
      'L: Skill 1   U: Skill 2',
      'ESC: Pause'
    ]
    controls.forEach((controlText, index) => {
      try {
        this.add.text(controlsX, controlsStartY + (index * lineHeight), controlText, {
          fontFamily: 'RetroPixel, monospace',
          fontSize: fontSize,
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'right'
        }).setOrigin(1, 0)
      } catch (error) {
        console.warn('Error creating control text:', error)
        this.add.text(controlsX, controlsStartY + (index * lineHeight), controlText, {
          fontFamily: 'Arial, sans-serif',
          fontSize: fontSize,
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'right'
        }).setOrigin(1, 0)
      }
    })
  }

  createSkillCooldownDisplay() {
    this.skillIconsCreated = false
  }

  getCurrentGameScene() {
    const scenes = ['Level1Scene', 'Level2Scene', 'Level3Scene']
    for (const sceneKey of scenes) {
      const scene = this.scene.get(sceneKey)
      if (scene && scene.scene.isActive()) {
        return scene
      }
    }
    return null
  }

  getCurrentLevelNumber() {
    if (!this.gameScene) return 1
    
    const sceneKey = this.gameScene.scene.key
    console.log('Getting level number for scene:', sceneKey)
    
    switch(sceneKey) {
      case 'Level1Scene': return 1
      case 'Level2Scene': return 2
      case 'Level3Scene': return 3
      default: return 1
    }
  }

  // Theme: underwater world — level display names
  getLevelDisplayName(levelNumber) {
    switch (levelNumber) {
      case 1: return 'UNDERWATER: VILLAGE DEPTHS'
      case 2: return 'UNDERWATER: RUINS DEPTHS'
      case 3: return 'UNDERWATER: TEMPLE DEPTHS'
      default: return `LEVEL ${levelNumber}`
    }
  }

  updateHealthBar(healthPercentage) {
    this.healthBar.clear()
    let color = 0x00ff00
    if (healthPercentage < 30) color = 0xff0000
    else if (healthPercentage < 60) color = 0xffff00
    
    this.healthBar.fillStyle(color)
    this.healthBar.fillRect(22, 22, (196 * healthPercentage / 100), 16)
  }

  update() {
    this.gameScene = this.getCurrentGameScene()
    if (this.gameScene && this.gameScene.player) {
      const healthPercentage = this.gameScene.player.getHealthPercentage()
      this.updateHealthBar(healthPercentage)
      this.updateSkillCooldownDisplay()
      
      const oxygenPercentage = this.gameScene.player.getOxygenPercentage ? 
        this.gameScene.player.getOxygenPercentage() : 100
      this.updateOxygenBar(oxygenPercentage)
    }
    this.updateLevelDisplay()
    if (this.savedText && this.savedText.active) {
      const n = this.registry.get('seaCreaturesSaved') || 0
      this.savedText.setText('Saved: ' + n)
    }
  }

  updateLevelDisplay() {
    const currentLevel = this.getCurrentLevelNumber()
    
    if (!this.levelText || !this.levelText.active) {
      console.log('Level text missing, recreating...')
      this.createLevelDisplay()
    }
    
    if (this.levelText) {
      try {
        const newText = this.getLevelDisplayName(currentLevel)
        if (this.levelText.text !== newText) {
          this.levelText.setText(newText)
          console.log('Level display updated to:', newText)
        }
      } catch (error) {
        console.warn('Error updating level text:', error)
        this.createLevelDisplay()
      }
    }
  }

  updateSkillCooldownDisplay() {
    if (!this.gameScene || !this.gameScene.player) return

    const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
    console.log('Current selected character:', selectedCharacter)

    if (!this.skillIconsCreated || this.lastSelectedCharacter !== selectedCharacter) {
      this.cleanupSkillIcons()
      
      try {
        this.createSkillIcons()
        this.skillIconsCreated = true
        this.lastSelectedCharacter = selectedCharacter
        console.log('Skill icons created for:', selectedCharacter)
      } catch (error) {
        console.error('Error creating skill icons:', error)
        this.time.delayedCall(500, () => {
          this.skillIconsCreated = false
        })
        return
      }
    }

    const player = this.gameScene.player
    
    if (selectedCharacter === 'NarutoPlayer') {
      this.updateNarutoSkills(player)
    } else {
      this.updateKakashiSasukeSkills(player)
    }
  }

  cleanupSkillIcons() {
    if (this.skill1Icon) {
      this.skill1Icon.destroy()
      this.skill1Icon = null
    }
    if (this.skill1CooldownMask) {
      this.skill1CooldownMask.destroy()
      this.skill1CooldownMask = null
    }
    if (this.skill1CooldownText) {
      this.skill1CooldownText.destroy()
      this.skill1CooldownText = null
    }
    if (this.skill1KeyText) {
      this.skill1KeyText.destroy()
      this.skill1KeyText = null
    }
    if (this.skill2Icon) {
      this.skill2Icon.destroy()
      this.skill2Icon = null
    }
    if (this.skill2CooldownMask) {
      this.skill2CooldownMask.destroy()
      this.skill2CooldownMask = null
    }
    if (this.skill2CooldownText) {
      this.skill2CooldownText.destroy()
      this.skill2CooldownText = null
    }
    if (this.skill2KeyText) {
      this.skill2KeyText.destroy()
      this.skill2KeyText = null
    }
  }

  shutdown() {
    console.log('UIScene shutting down')
    this.cleanupSkillIcons()
    if (this.levelText) {
      this.levelText.destroy()
      this.levelText = null
    }
    if (this.comboTimer) {
      this.comboTimer.remove()
      this.comboTimer = null
    }
    if (this.comboText) {
      this.comboText.destroy()
      this.comboText = null
    }
    this.comboCount = 0
    this.skillIconsCreated = false
    this.lastSelectedCharacter = null
    this.gameScene = null
  }

  createSkillIcons() {
    const selectedCharacter = this.registry.get('selectedCharacter') || 'KakashiPlayer'
    console.log('Creating skill icons for character:', selectedCharacter)
    
    const iconSize = 45
    const iconSpacing = 55
    const startX = 20
    const startY = 110
    
    if (selectedCharacter === 'NarutoPlayer') {
      console.log('Creating Naruto skill icons')
      
      this.skill1Icon = this.add.image(startX, startY, 'rasengan_icon')
      this.skill1Icon.setDisplaySize(iconSize, iconSize)
      this.skill1Icon.setOrigin(0, 1)
      
      this.skill1CooldownMask = this.add.graphics()
      this.skill1CooldownText = this.add.text(startX + iconSize/2, startY - iconSize/2, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
      
      this.skill1KeyText = this.add.text(startX + iconSize/2, startY - iconSize - 5, 'L', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 1)
      
      this.skill2Icon = this.add.image(startX + iconSpacing, startY, 'summoning_icon')
      this.skill2Icon.setDisplaySize(iconSize, iconSize)
      this.skill2Icon.setOrigin(0, 1)
      
      this.skill2CooldownMask = this.add.graphics()
      this.skill2CooldownText = this.add.text(startX + iconSpacing + iconSize/2, startY - iconSize/2, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
      
      this.skill2KeyText = this.add.text(startX + iconSpacing + iconSize/2, startY - iconSize - 5, 'U', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 1)
    } else {
      console.log('Creating Kakashi/Sasuke skill icons')
      
      this.skill1Icon = this.add.image(startX, startY, 'chidori_icon')
      this.skill1Icon.setDisplaySize(iconSize, iconSize)
      this.skill1Icon.setOrigin(0, 1)
      
      this.skill1CooldownMask = this.add.graphics()
      this.skill1CooldownText = this.add.text(startX + iconSize/2, startY - iconSize/2, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
      
      this.skill1KeyText = this.add.text(startX + iconSize/2, startY - iconSize - 5, 'L', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 1)
      
      this.skill2Icon = this.add.image(startX + iconSpacing, startY, 'sharingan_icon')
      this.skill2Icon.setDisplaySize(iconSize, iconSize)
      this.skill2Icon.setOrigin(0, 1)
      
      this.skill2CooldownMask = this.add.graphics()
      this.skill2CooldownText = this.add.text(startX + iconSpacing + iconSize/2, startY - iconSize/2, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5)
      
      this.skill2KeyText = this.add.text(startX + iconSpacing + iconSize/2, startY - iconSize - 5, 'U', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 1)
    }
  }



  updateNarutoSkills(player) {
    if (!this.skill1CooldownMask || !this.skill1CooldownText || 
        !this.skill2CooldownMask || !this.skill2CooldownText ||
        !this.skill1Icon || !this.skill2Icon) {
      return
    }

    const iconSize = 45
    const iconSpacing = 55
    const startX = 20
    const startY = 110
    this.skill1CooldownMask.clear()
    if (player.canUseRasengan()) {
      try {
        this.skill1CooldownText.setText('')
        this.skill1Icon.setTint(0xffffff)
      } catch (error) {
        console.warn('Error updating rasengan skill display:', error)
      }
    } else {
      const remainingMs = player.getRasenganCooldownRemaining()
      const totalCooldown = player.rasenganCooldown
      const cooldownProgress = 1 - (remainingMs / totalCooldown)
      const remainingSeconds = Math.ceil(remainingMs / 1000)
      
      try {
        this.skill1CooldownText.setText(remainingSeconds.toString())
        this.skill1CooldownMask.fillStyle(0x000000, 0.7)
        this.drawCooldownMask(this.skill1CooldownMask, startX + iconSize/2, startY - iconSize/2, iconSize/2, cooldownProgress)
        this.skill1Icon.setTint(0x666666)
      } catch (error) {
        console.warn('Error updating rasengan cooldown display:', error)
      }
    }
    this.skill2CooldownMask.clear()
    if (player.canUseSummoning()) {
      try {
        this.skill2CooldownText.setText('')
        this.skill2Icon.setTint(0xffffff)
      } catch (error) {
        console.warn('Error updating summoning skill display:', error)
      }
    } else {
      const remainingMs = player.getSummoningCooldownRemaining()
      const totalCooldown = player.summoningCooldown
      const cooldownProgress = 1 - (remainingMs / totalCooldown)
      const remainingSeconds = Math.ceil(remainingMs / 1000)
      
      try {
        this.skill2CooldownText.setText(remainingSeconds.toString())
        this.skill2CooldownMask.fillStyle(0x000000, 0.7)
        this.drawCooldownMask(this.skill2CooldownMask, startX + iconSpacing + iconSize/2, startY - iconSize/2, iconSize/2, cooldownProgress)
        this.skill2Icon.setTint(0x666666)
      } catch (error) {
        console.warn('Error updating summoning cooldown display:', error)
      }
    }
  }

  updateKakashiSasukeSkills(player) {
    if (!this.skill1CooldownMask || !this.skill1CooldownText || 
        !this.skill2CooldownMask || !this.skill2CooldownText ||
        !this.skill1Icon || !this.skill2Icon) {
      return
    }

    const iconSize = 45
    const iconSpacing = 55
    const startX = 20
    const startY = 110
    this.skill1CooldownMask.clear()
    if (player.canUseChidori()) {
      try {
        this.skill1CooldownText.setText('')
        this.skill1Icon.setTint(0xffffff)
      } catch (error) {
        console.warn('Error updating chidori skill display:', error)
      }
    } else {
      const remainingMs = player.getChidoriCooldownRemaining()
      const totalCooldown = player.chidoriCooldown
      const cooldownProgress = 1 - (remainingMs / totalCooldown)
      const remainingSeconds = Math.ceil(remainingMs / 1000)
      
      try {
        this.skill1CooldownText.setText(remainingSeconds.toString())
        this.skill1CooldownMask.fillStyle(0x000000, 0.7)
        this.drawCooldownMask(this.skill1CooldownMask, startX + iconSize/2, startY - iconSize/2, iconSize/2, cooldownProgress)
        this.skill1Icon.setTint(0x666666)
      } catch (error) {
        console.warn('Error updating chidori cooldown display:', error)
      }
    }
    this.skill2CooldownMask.clear()
    if (player.canUseSharingan()) {
      try {
        this.skill2CooldownText.setText('')
        this.skill2Icon.setTint(0xffffff)
      } catch (error) {
        console.warn('Error updating sharingan skill display:', error)
      }
    } else {
      const remainingMs = player.getSharinganCooldownRemaining()
      const totalCooldown = player.sharinganCooldown
      const cooldownProgress = 1 - (remainingMs / totalCooldown)
      const remainingSeconds = Math.ceil(remainingMs / 1000)
      
      try {
        this.skill2CooldownText.setText(remainingSeconds.toString())
        this.skill2CooldownMask.fillStyle(0x000000, 0.7)
        this.drawCooldownMask(this.skill2CooldownMask, startX + iconSpacing + iconSize/2, startY - iconSize/2, iconSize/2, cooldownProgress)
        this.skill2Icon.setTint(0x666666)
      } catch (error) {
        console.warn('Error updating sharingan cooldown display:', error)
      }
    }
  }

  drawCooldownMask(graphics, centerX, centerY, radius, progress) {
    if (progress >= 1) return
    graphics.beginPath()
    graphics.moveTo(centerX, centerY)
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (2 * Math.PI * (1 - progress))
    
    graphics.arc(centerX, centerY, radius, startAngle, endAngle, false)
    graphics.closePath()
    graphics.fillPath()
  }
}