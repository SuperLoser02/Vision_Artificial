import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        node: true,
      },
    },
  },
  // Reglas recomendadas para React Hooks y Fast Refresh en Vite
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.vite,
]
