import Phaser from 'phaser'

const SETTINGS_KEY = 'anime-game-settings-v1'

const defaultSettings = {
  masterVolume: 0.6,
  musicMuted: false,
  showControlsHints: true,
  tutorialSeen: false
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw)
    return { ...defaultSettings, ...parsed }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(nextSettings) {
  const merged = { ...defaultSettings, ...nextSettings }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  } catch {
    // Ignore storage errors, game remains playable.
  }
  return merged
}

export function applyAudioSettings(scene) {
  const settings = loadSettings()
  if (scene && scene.sound) {
    scene.sound.volume = Phaser.Math.Clamp(settings.masterVolume, 0, 1)
    scene.sound.mute = !!settings.musicMuted
  }
  return settings
}

export function toggleMute(scene) {
  const settings = loadSettings()
  const updated = saveSettings({ ...settings, musicMuted: !settings.musicMuted })
  if (scene && scene.sound) {
    scene.sound.mute = !!updated.musicMuted
  }
  return updated
}

export function toggleControlsHints() {
  const settings = loadSettings()
  return saveSettings({ ...settings, showControlsHints: !settings.showControlsHints })
}

export function markTutorialSeen() {
  const settings = loadSettings()
  return saveSettings({ ...settings, tutorialSeen: true })
}
