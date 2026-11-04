// Shared settings shape and defaults for every extension surface
// (background worker, content script, popup, options page).
// Change a default here and it applies everywhere.
export const DEFAULT_ENABLED = true
export const DEFAULT_DIFFICULTY = 'medium'
export const DEFAULT_LANGUAGE = 'en'

// A type alias (not an interface) so the object is assignable where
// chrome.storage expects a string-indexed defaults object.
export type ExtensionSettings = {
  enabled: boolean
  difficulty: string
  language: string
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: DEFAULT_ENABLED,
  difficulty: DEFAULT_DIFFICULTY,
  language: DEFAULT_LANGUAGE,
}
