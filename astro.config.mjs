// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: 'https://www.emeasuretool.cms.gov',
  build: {
    assets: 'assets',
  },
});
