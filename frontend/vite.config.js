import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    /* Vite's default output directory is also `assets`, which is exactly where
       public/assets/ (the seeded product photography) gets copied. The two
       merge in dist/, so there is no way to cache the content-hashed bundles
       aggressively without also freezing photos that have stable filenames and
       do get replaced. Emitting build output to `static` keeps them separate,
       so netlify.toml can cache /static/* immutably and leave /assets/* alone. */
    assetsDir: 'static',
  },
})
