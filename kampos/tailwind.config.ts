import type { Config } from 'tailwindcss';
import tailwindSpring from 'tailwindcss-spring';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [
    tailwindSpring,
],
};

export default config;
