# Theme Architecture Guide

## Modes Supported
- **Light**: Standard enterprise light theme.
- **Dark**: Dark mode using Slate color palette.
- **System**: Automatically matches Windows OS preference (`prefers-color-scheme`).

## Token Setup
Theme variables are declared in `src/renderer/styles/globals.css` and mapped to TailwindCSS in `tailwind.config.js`.

To use theme variables inside components, rely on Tailwind `dark:` variant classes or utility variables. Never hardcode RGB/HEX strings directly inside components.
