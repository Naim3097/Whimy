import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The project lives in a OneDrive folder, whose directories are reparse
  // points the native resolver cannot canonicalise. Nothing here is symlinked,
  // so resolving paths as written is safe and keeps fresh builds working.
  resolve: { preserveSymlinks: true },
  // OneDrive's sync layer drops some native file-change events, so the dev
  // server misses edits; polling sees every save.
  server: { port: 5173, watch: { usePolling: true, interval: 250 } },
})
