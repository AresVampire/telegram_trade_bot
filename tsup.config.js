import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['./scripts/bot.ts', './scripts/worker.ts'],
  publicDir: './locales',
  format: 'esm',
  minify: !options.watch,
  splitting: true,
  sourcemap: true,
  clean: false,
}))
