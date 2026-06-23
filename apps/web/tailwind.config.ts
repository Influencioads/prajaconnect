import type { Config } from 'tailwindcss';
import preset from '@praja/config/tailwind';
import animate from 'tailwindcss-animate';

const config: Config = {
  presets: [preset as Config],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  plugins: [animate],
};

export default config;
