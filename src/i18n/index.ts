// Two languages, chosen once at start-up.
//
// Interface strings live in ./en.ts and ./id.ts and are read with $t() / t().
// Story and case content is written next to its data with tr(english, indonesian),
// so a line and its translation can never drift apart.
//
// Switching language reloads the page: a lot of text is baked into canvases
// and plain data modules, and a reload is the one way to keep it all in step.

import { createI18n } from 'vue-i18n'
import en from './en'
import id from './id'

export type Locale = 'en' | 'id'
const KEY = 'stride_lang'

export const LOCALE: Locale = (() => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'id') return saved
  } catch { /* noop */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en'
})()

export const i18n = createI18n({
  legacy: false,
  locale: LOCALE,
  fallbackLocale: 'en',
  messages: { en, id },
})

export const t = i18n.global.t

/** Content written inline in both languages. */
export const tr = (english: string, indonesian: string) => (LOCALE === 'id' ? indonesian : english)

export function setLocale(locale: Locale) {
  if (locale === LOCALE) return
  try { localStorage.setItem(KEY, locale) } catch { /* noop */ }
  location.reload()
}

if (typeof document !== 'undefined') document.documentElement.lang = LOCALE
