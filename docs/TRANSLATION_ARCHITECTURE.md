# Translation & Localization Architecture

## Supported Languages
- English (`en`) - Left-to-Right (`ltr`)
- Arabic (`ar`) - Right-to-Left (`rtl`)

## Dynamic RTL Switching
When `useLanguageStore.setLanguage('ar')` is invoked:
1. `document.documentElement.setAttribute('dir', 'rtl')` is set automatically.
2. `document.documentElement.setAttribute('lang', 'ar')` is set automatically.
3. UI elements flip text alignment and positioning according to CSS RTL rules.

## Translation Dictionaries
Stored in `src/renderer/translations/en.json` and `ar.json`. Reusable components access strings via `useLanguageStore().t('key_name')`.
