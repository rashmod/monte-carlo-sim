import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	test: {
		globals: true,
		environment: 'node', // Use 'node' for pure unit tests, 'jsdom' only if testing React components
		setupFiles: './src/test/setup.ts',
	},
});

