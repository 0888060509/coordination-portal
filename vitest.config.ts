
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
});
</lov-add-dependency>jest-dom@latest</lov-add-dependency>
<lov-add-dependency>@testing-library/jest-dom@^6.1.5</lov-add-dependency>
