import Phaser from "phaser"
import { screenSize, debugConfig, renderConfig } from "./gameConfig.json"

// Import scenes
import { Preloader } from './Preloader.js'
import { TitleScreen } from './TitleScreen.js'
import { CharacterSelectScene } from './CharacterSelectScene.js'
import { Level1Scene } from './Level1Scene.js'
import { Level2Scene } from './Level2Scene.js'
import { Level3Scene } from './Level3Scene.js'
import { UIScene } from './UIScene.js'
import { PauseUIScene } from './PauseUIScene.js'
import { GameOverUIScene } from './GameOverUIScene.js'
import { VictoryUIScene } from './VictoryUIScene.js'
import { GameCompleteUIScene } from './GameCompleteUIScene.js'

const config = {
  type: Phaser.AUTO,
  width: screenSize.width.value,
  height: screenSize.height.value,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      fps: 120,
      gravity: { y: 0 },
      debug: debugConfig.debug.value,
      debugShowBody: debugConfig.debugShowBody.value,
      debugShowStaticBody: debugConfig.debugShowStaticBody.value,
      debugShowVelocity: debugConfig.debugShowVelocity.value,
    },
  },
  pixelArt: renderConfig.pixelArt.value,
  scene: [Preloader, TitleScreen, CharacterSelectScene, Level1Scene, Level2Scene, Level3Scene, UIScene, PauseUIScene, VictoryUIScene, GameCompleteUIScene, GameOverUIScene],
}

export default new Phaser.Game(config)
