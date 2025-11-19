import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  prettierConfig,
  stylistic.configs.recommended,
)
