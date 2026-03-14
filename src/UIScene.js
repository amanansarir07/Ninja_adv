import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'
import { loadSettings } from './settings.js'

export class UIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "UIScene",
    })
  }

  create() {
    this.initUILayout()
    this.createHUDPanels()
    this.createHealthBar()
    this.createOxygenBar()
    this.createLevelDisplay()
    this.createDifficultyDisplay()
    this.createObjectiveDisplay()
    this.createTimerDisplay()
    this.createBossHealthBar()
    this.createPauseButton()
    this.createAttackHint()
    this.createControlsHint()
    this.setupControlsToggle()
    this.createSkillCooldownDisplay()
    this.createSavedCounter()
    this.createComboCounter()
    this.gameScene = this.getCurrentGameScene()
    this.setupComboListener()
    this.setupCinematicHUDBehavior()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)
  }

  setupCinematicHUDBehavior() {
    this.hudFullAlpha = 1
    this.hudDimAlpha = 0.68
    this.hudDimDelayMs = 2200
    this.lastActivityTime = this.time.now
    this.hudIsDimmed = false
    this.previousHealthValue = null
    this.previousOxygenValue = null

    this.onAnyKeyDown = () => this.markHUDActivity()
    this.onPointerDown = () => this.markHUDActivity()
    this.input.keyboard.on('keydown', this.onAnyKeyDown)
    this.input.on('pointerdown', this.onPointerDown)
  }

  markHUDActivity() {
    this.lastActivityTime = this.time.now
    if (this.hudIsDimmed) this.setHUDDimmed(false)
  }

  setHUDDimmed(dimmed) {
    if (this.hudIsDimmed === dimmed) return
    this.hudIsDimmed = dimmed
    const target = dimmed ? this.hudDimAlpha : this.hudFullAlpha

    const hudTargets = [
      this.statsPanel,
      this.levelPanel,
      this.healthBarBg,
      this.healthBar,
      this.healthText,
      this.oxygenBarBg,
      this.oxygenBar,
      this.oxygenText,
      this.savedText,
      this.levelText,
      this.difficultyText,
      this.attackHintBg,
      this.attackHintText,
      this.controlsHintTrigger,
      this.pauseButton && this.pauseButton.buttonBg,
      this.pauseButton && this.pauseButton.buttonText,
      this.bossBarPanel,
      this.bossBarBg,
      this.bossBarFill,
      this.bossBarTitle
    ].filter(Boolean)

    this.tweens.add({
      targets: hudTargets,
      alpha: target,
      duration: 260,
      ease: 'Sine.easeOut'
    })
  }

  initUILayout() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    this.uiLayout = {
      stats: { x: 18, y: 12, w: 292, h: 82 },
      levelBadge: { x: screenWidth / 2, y: 22, w: 430, h: 34 },
      controls: { x: screenWidth - 300, y: 86, w: 284, h: 124 },
      skills: { x: 20, y: screenHeight - 18 },
      pause: { x: screenWidth - 64, y: 40 }
    }
  }

  createHUDPanels() {
    const stats = this.uiLayout.stats
    this.statsPanel = this.add.graphics()
    this.statsPanel.fillStyle(0x04101d, 0.24)
    this.statsPanel.fillRoundedRect(stats.x, stats.y, stats.w, stats.h, 10)
    this.statsPanel.lineStyle(1, 0x9fcae8, 0.28)
    this.statsPanel.strokeRoundedRect(stats.x, stats.y, stats.w, stats.h, 10)

    const badge = this.uiLayout.levelBadge
    this.levelPanel = this.add.graphics()
    this.levelPanel.fillStyle(0x04101d, 0.2)
    this.levelPanel.fillRoundedRect(badge.x - badge.w / 2, badge.y - badge.h / 2, badge.w, badge.h, 10)
    this.levelPanel.lineStyle(1, 0x9fcae8, 0.2)
    this.levelPanel.strokeRoundedRect(badge.x - badge.w / 2, badge.y - badge.h / 2, badge.w, badge.h, 10)

  }

  createSavedCounter() {
    const stats = this.uiLayout.stats
    this.savedText = this.add.text(stats.x + 214, stats.y + 12, 'Saved 0', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '9px',
      fill: '#4dff88'
    })
  }

  createDifficultyDisplay() {
    const label = this.registry.get('difficultyLabel') || 'Normal'
    const stats = this.uiLayout.stats
    this.difficultyText = this.add.text(stats.x + 10, stats.y + 64, `D:${label}  E:0  T:00:00`, {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '8px',
      fill: '#d5e9f8'
    }).setOrigin(0, 0.5)
  }

  createObjectiveDisplay() {
    // Merged into the compact status line near the level badge.
    this.objectiveText = null
  }

  createTimerDisplay() {
    // Merged into the compact status line near the level badge.
    this.timerText = null
  }

  createOxygenBar() {
    const stats = this.uiLayout.stats
    this.oxygenBarBg = this.add.graphics()
    this.oxygenBarBg.fillStyle(0x00111e, 0.58)
    this.oxygenBarBg.fillRect(stats.x + 44, stats.y + 42, 160, 10)
    this.oxygenBar = this.add.graphics()
    this.oxygenText = this.add.text(stats.x + 10, stats.y + 43, 'O2', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '8px',
      fill: '#87ceeb'
    })
  }

  updateOxygenBar(oxygenPercentage) {
    if (!this.oxygenBar) return
    const stats = this.uiLayout.stats
    this.oxygenBar.clear()
    let color = 0x87ceeb
    if (oxygenPercentage < 30) color = 0xff6666
    else if (oxygenPercentage < 60) color = 0xffaa66
    
    this.oxygenBar.fillStyle(color)
    this.oxygenBar.fillRect(stats.x + 46, stats.y + 44, (156 * oxygenPercentage / 100), 6)
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
    this.comboListenerScenes = []
    const scenes = ['Level1Scene', 'Level2Scene', 'Level3Scene', 'Level4Scene']
    scenes.forEach(sceneKey => {
      const scene = this.safeGetScene(sceneKey)
      if (scene && scene.events) {
        scene.events.on('enemyHit', this.addCombo, this)
        this.comboListenerScenes.push(scene)
      }
    })
  }

  safeGetScene(sceneKey) {
    try {
      const existing = this.scene.manager && this.scene.manager.keys ? this.scene.manager.keys[sceneKey] : null
      if (!existing) return null
      return this.scene.get(sceneKey)
    } catch {
      return null
    }
  }

  addCombo() {
    this.markHUDActivity()
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
    const stats = this.uiLayout.stats
    this.healthBarBg = this.add.graphics()
    this.healthBarBg.fillStyle(0x00111e, 0.58)
    this.healthBarBg.fillRect(stats.x + 10, stats.y + 10, 194, 18)
    this.healthBar = this.add.graphics()
    try {
      this.healthText = this.add.text(stats.x + 10, stats.y + 12, 'HEALTH', {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '11px',
        fill: '#ffffff'
      })
    } catch (error) {
      console.warn('Error creating health text:', error)
      this.healthText = this.add.text(stats.x + 10, stats.y + 12, 'HEALTH', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fill: '#ffffff'
      })
    }
  }

  createLevelDisplay() {
    const badge = this.uiLayout.levelBadge
    if (this.levelText && this.levelText.destroy) {
      this.levelText.destroy()
      this.levelText = null
    }
    
    const currentLevel = this.getCurrentLevelNumber()
    const levelDisplayName = this.getLevelDisplayName(currentLevel)
    try {
      this.levelText = this.add.text(badge.x, badge.y, 
        levelDisplayName, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '11px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating level text with RetroPixel font:', error)
      this.levelText = this.add.text(badge.x, badge.y, 
        levelDisplayName, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5, 0.5)
    }
    
  }

  createPauseButton() {
    const pause = this.uiLayout.pause
    const buttonBg = this.add.graphics()
    buttonBg.fillStyle(0x0a1a2a, 0.52)
    buttonBg.fillRoundedRect(-34, -16, 68, 32, 8)
    buttonBg.lineStyle(1, 0x9fcae8, 0.35)
    buttonBg.strokeRoundedRect(-34, -16, 68, 32, 8)
    buttonBg.setPosition(pause.x, pause.y)
    let buttonText
    try {
      buttonText = this.add.text(pause.x, pause.y, 'PAUSE', {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '10px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    } catch (error) {
      console.warn('Error creating pause button text:', error)
      buttonText = this.add.text(pause.x, pause.y, 'PAUSE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        align: 'center'
      }).setOrigin(0.5, 0.5)
    }
    const buttonZone = this.add.zone(pause.x, pause.y, 68, 32)
    buttonZone.setInteractive()
      .on('pointerdown', () => this.pauseGame())
      .on('pointerover', () => {
        buttonBg.clear()
        buttonBg.fillStyle(0x2f6fa1, 0.58)
        buttonBg.fillRoundedRect(-34, -16, 68, 32, 8)
        buttonBg.lineStyle(1, 0xaed8ff, 0.6)
        buttonBg.strokeRoundedRect(-34, -16, 68, 32, 8)
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
        buttonBg.fillStyle(0x0a1a2a, 0.52)
        buttonBg.fillRoundedRect(-34, -16, 68, 32, 8)
        buttonBg.lineStyle(1, 0x9fcae8, 0.35)
        buttonBg.strokeRoundedRect(-34, -16, 68, 32, 8)
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
      if (gameScene.isBossIntroActive) return
      // Delegate to the level scene pause flow, which handles scene order safely.
      if (typeof gameScene.pauseGame === 'function') {
        gameScene.pauseGame()
      } else {
        this.scene.pause(gameScene.scene.key)
        this.scene.pause("UIScene")
        this.scene.launch("PauseUIScene", {
          currentLevelKey: gameScene.scene.key
        })
      }
    }
  }

  createAttackHint() {
    const pause = this.uiLayout.pause
    const hintY = pause.y + 30

    this.attackHintBg = this.add.graphics()
    this.attackHintBg.fillStyle(0x0a1a2a, 0.52)
    this.attackHintBg.fillRoundedRect(pause.x - 58, hintY - 10, 116, 20, 6)
    this.attackHintBg.lineStyle(1, 0x9fcae8, 0.35)
    this.attackHintBg.strokeRoundedRect(pause.x - 58, hintY - 10, 116, 20, 6)

    this.attackHintText = this.add.text(pause.x, hintY, 'ATTACK: J / K', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '8px',
      fill: '#ffef9d',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5).setAlpha(0.95)
  }

  createControlsHint() {
    const settings = loadSettings()
    if (!settings.showControlsHints) return

    const controls = this.uiLayout.controls
    this.controlsHintTrigger = this.add.text(screenSize.width.value - 14, 68, '', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '8px',
      fill: '#bcd8eb'
    }).setOrigin(1, 0)

    this.controlsOverlay = this.add.container(0, 0)
    const panel = this.add.graphics()
    panel.fillStyle(0x07111c, 0.72)
    panel.fillRoundedRect(controls.x, controls.y, controls.w, controls.h, 10)
    panel.lineStyle(1, 0x8ab5d8, 0.4)
    panel.strokeRoundedRect(controls.x, controls.y, controls.w, controls.h, 10)
    this.controlsOverlay.add(panel)

    const controlsX = controls.x + 12
    const controlsStartY = controls.y + 12
    const lineHeight = 22
    const controlLines = [
      'Move: WASD / Arrows',
      'Melee: J / K',
      'Skills: L / U',
      'Pause: ESC'
    ]
    controlLines.forEach((controlText, index) => {
      let t
      try {
        t = this.add.text(controlsX, controlsStartY + (index * lineHeight), controlText, {
          fontFamily: 'RetroPixel, monospace',
          fontSize: '9px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 1,
          align: 'left'
        }).setOrigin(0, 0)
      } catch (error) {
        console.warn('Error creating control text:', error)
        t = this.add.text(controlsX, controlsStartY + (index * lineHeight), controlText, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '9px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 1,
          align: 'left'
        }).setOrigin(0, 0)
      }
      this.controlsOverlay.add(t)
    })
    this.controlsOverlay.setVisible(false)
  }

  setupControlsToggle() {
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
    this.controlsAutoHideTimer = null
  }

  showControlsOverlay() {
    if (!this.controlsOverlay) return
    this.controlsOverlay.setVisible(true)
    if (this.controlsAutoHideTimer) this.controlsAutoHideTimer.remove()
    this.controlsAutoHideTimer = this.time.delayedCall(3500, () => {
      if (this.controlsOverlay) this.controlsOverlay.setVisible(false)
    })
  }

  createSkillCooldownDisplay() {
    this.skillIconsCreated = false
  }

  getCurrentGameScene() {
    const scenes = ['Level1Scene', 'Level2Scene', 'Level3Scene', 'Level4Scene']
    for (const sceneKey of scenes) {
      const scene = this.safeGetScene(sceneKey)
      if (scene && scene.scene.isActive()) {
        return scene
      }
    }
    return null
  }

  getCurrentLevelNumber() {
    if (!this.gameScene) return 1
    
    const sceneKey = this.gameScene.scene.key
    
    switch(sceneKey) {
      case 'Level1Scene': return 1
      case 'Level2Scene': return 2
      case 'Level3Scene': return 3
      case 'Level4Scene': return 4
      default: return 1
    }
  }

  // Theme: underwater world — level display names
  getLevelDisplayName(levelNumber) {
    switch (levelNumber) {
      case 1: return 'UNDERWATER: VILLAGE DEPTHS'
      case 2: return 'UNDERWATER: RUINS DEPTHS'
      case 3: return 'UNDERWATER: TEMPLE DEPTHS'
      case 4: return 'UNDERWATER: FIRE FORTRESS'
      default: return `LEVEL ${levelNumber}`
    }
  }

  updateHealthBar(healthPercentage) {
    const stats = this.uiLayout.stats
    this.healthBar.clear()
    let color = 0x00ff00
    if (healthPercentage < 30) color = 0xff0000
    else if (healthPercentage < 60) color = 0xffff00
    
    this.healthBar.fillStyle(color)
    this.healthBar.fillRect(stats.x + 12, stats.y + 12, (186 * healthPercentage / 100), 14)
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

      if (this.previousHealthValue !== null && healthPercentage < this.previousHealthValue) {
        this.markHUDActivity()
      }
      if (this.previousOxygenValue !== null && oxygenPercentage < this.previousOxygenValue - 2) {
        this.markHUDActivity()
      }
      this.previousHealthValue = healthPercentage
      this.previousOxygenValue = oxygenPercentage
      this.updateBossHealthBar()

      const remaining = this.gameScene.getRemainingEnemyCount ? this.gameScene.getRemainingEnemyCount() : 0

      const elapsed = this.gameScene.getElapsedSeconds ? this.gameScene.getElapsedSeconds() : 0
      const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
      const ss = String(elapsed % 60).padStart(2, '0')
      if (this.difficultyText) {
        const label = this.registry.get('difficultyLabel') || 'Normal'
        this.difficultyText.setText(`D:${label}  E:${remaining}  T:${mm}:${ss}`)
      }
    }
    this.updateLevelDisplay()
    if (this.savedText && this.savedText.active) {
      const n = this.registry.get('seaCreaturesSaved') || 0
      this.savedText.setText('Saved ' + n)
    }
    if (this.tabKey && Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      this.markHUDActivity()
      this.showControlsOverlay()
    }

    const shouldDim = (this.time.now - this.lastActivityTime) >= this.hudDimDelayMs
    if (shouldDim && !this.hudIsDimmed) this.setHUDDimmed(true)
  }

  createBossHealthBar() {
    const centerX = screenSize.width.value / 2
    this.bossBarVisible = false
    this.bossBarWidth = Math.min(580, Math.floor(screenSize.width.value * 0.55))

    this.bossBarPanel = this.add.rectangle(centerX, -40, this.bossBarWidth + 24, 42, 0x1b0303, 0.9)
      .setStrokeStyle(2, 0xff6d6d, 0.95)
      .setAlpha(0)
    this.bossBarBg = this.add.rectangle(centerX, -38, this.bossBarWidth, 12, 0x3a0909, 1)
      .setAlpha(0)
    this.bossBarFill = this.add.rectangle(centerX - this.bossBarWidth / 2, -38, this.bossBarWidth, 10, 0xff3535, 1)
      .setOrigin(0, 0.5)
      .setAlpha(0)
    this.bossBarTitle = this.add.text(centerX, -55, 'BOSS', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '10px',
      fill: '#ffd5d5',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0)
  }

  showBossHealthBar(title) {
    if (this.bossBarVisible) return
    this.bossBarVisible = true
    if (this.bossBarTitle) this.bossBarTitle.setText(title || 'BOSS')

    this.tweens.add({
      targets: [this.bossBarPanel, this.bossBarBg, this.bossBarFill, this.bossBarTitle],
      y: '+=92',
      alpha: 1,
      duration: 360,
      ease: 'Back.easeOut'
    })
  }

  hideBossHealthBar() {
    if (!this.bossBarVisible) return
    this.bossBarVisible = false
    this.tweens.add({
      targets: [this.bossBarPanel, this.bossBarBg, this.bossBarFill, this.bossBarTitle],
      y: '-=92',
      alpha: 0,
      duration: 260,
      ease: 'Sine.easeInOut'
    })
  }

  updateBossHealthBar() {
    if (!this.gameScene || typeof this.gameScene.getBossHUDData !== 'function') {
      this.hideBossHealthBar()
      return
    }

    const hudData = this.gameScene.getBossHUDData()
    if (!hudData) {
      this.hideBossHealthBar()
      return
    }

    this.showBossHealthBar(hudData.title)
    const ratio = Phaser.Math.Clamp(hudData.healthRatio || 0, 0, 1)
    this.bossBarFill.width = Math.max(0, this.bossBarWidth * ratio)

    if (ratio <= 0) this.hideBossHealthBar()
  }

  updateLevelDisplay() {
    const currentLevel = this.getCurrentLevelNumber()
    
    if (!this.levelText || !this.levelText.active) {
      this.createLevelDisplay()
    }
    
    if (this.levelText) {
      try {
        const newText = this.getLevelDisplayName(currentLevel)
        if (this.levelText.text !== newText) {
          this.levelText.setText(newText)
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

    if (!this.skillIconsCreated || this.lastSelectedCharacter !== selectedCharacter) {
      this.cleanupSkillIcons()
      
      try {
        this.createSkillIcons()
        this.skillIconsCreated = true
        this.lastSelectedCharacter = selectedCharacter
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
    if (this.onAnyKeyDown) this.input.keyboard.off('keydown', this.onAnyKeyDown)
    if (this.onPointerDown) this.input.off('pointerdown', this.onPointerDown)
    if (this.comboListenerScenes && this.comboListenerScenes.length) {
      this.comboListenerScenes.forEach(scene => {
        if (scene && scene.events) {
          scene.events.off('enemyHit', this.addCombo, this)
        }
      })
    }
    this.comboListenerScenes = []
    this.onAnyKeyDown = null
    this.onPointerDown = null
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
    
    const iconSize = 42
    const iconSpacing = 52
    const startX = this.uiLayout.skills.x
    const startY = this.uiLayout.skills.y
    
    if (selectedCharacter === 'NarutoPlayer') {
      
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

    const iconSize = 42
    const iconSpacing = 52
    const startX = this.uiLayout.skills.x
    const startY = this.uiLayout.skills.y
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

    const iconSize = 42
    const iconSpacing = 52
    const startX = this.uiLayout.skills.x
    const startY = this.uiLayout.skills.y
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
