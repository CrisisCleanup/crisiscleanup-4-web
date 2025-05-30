import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as vitest from 'vitest';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import autoImport from 'unplugin-auto-import/vite';
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import inspect from 'vite-plugin-inspect';
import inspector from 'vite-plugin-vue-inspector';
import markdownRawPlugin from 'vite-raw-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import postcssConfig from './postcss.config';

export default defineConfig(async ({ command }) => {
  const vitePlugins = [
    vue(),
    vueJsx(),
    // https://github.com/antfu/unplugin-auto-import
    autoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        'vue/macros',
        'vuex',
        'vitest', // see: https://vitest.dev/config/#globals
        '@vueuse/core',
        {
          '@/hooks/useApi': ['useApi'],
        },
      ],
      dts: 'src/types/auto-imports.d.ts',
      dirs: ['src/stores'],
      vueTemplate: true,
      // Generate corresponding .eslintrc-auto-import.json file.
      // eslint globals Docs - https://eslint.org/docs/user-guide/configuring/language-options#specifying-globals
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
    }),
    Icons({
      compiler: 'vue3',
      customCollections: {
        'ccu-disaster-icons': FileSystemIconLoader('src/assets/disaster_icons'),
      },
    }),
    // https://github.com/antfu/vite-plugin-inspect
    inspect(),
    // https://github.com/webfansplz/vite-plugin-vue-inspector
    // inspector(),
    markdownRawPlugin({
      fileRegex: /\.svgr$/,
    }),
  ] as PluginOption[];

  const configs: Array<Partial<UserConfig>> = [];
  configs.push({
    optimizeDeps: {
      include: ['tailwind.config'],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
        'tailwind.config': fileURLToPath(
          new URL('tailwind.config.cjs', import.meta.url),
        ),
      },
    },
    css: {
      postcss: {
        ...postcssConfig,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // todo: do not statically import downloads into asset builder
            'group-downloads': [
              './src/pages/Downloads.vue',
              './src/components/admin/incidents/IncidentAssetBuilder.vue',
            ],
          },
        },
      },
    },
  });

  if (command === 'build') {
    vitePlugins.push(
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: 'crisis-cleanup',
        project: 'crisiscleanup-4-web',
      }),
    );
    configs.push({
      esbuild: {
        treeShaking: true,
      },
      build: {
        sourcemap: true,
      },
    });
  }

  // Vitest config
  configs.push(
    {
      test: {
        include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
        exclude: ['test/e2e/**/*'],
        setupFiles: ['./test/setupTests.ts', 'fake-indexeddb/auto'],
        globals: true,
        environment: 'happy-dom',
        deps: {
          optimizer: {
            web: {
              include: ['@vue', '@vueuse'],
            },
          },
        },
        coverage: {
          provider: 'v8',
          include: ['src/**'],
          exclude: ['src/external/**', 'src/assets/vendor/js/**'],
          reporter: ['text', 'json', 'html'],
        },
        globalSetup: './test/globalSetup.ts',
      },
    },
    {
      plugins: vitePlugins,
    },
  );

  return _.merge({}, ...configs) as UserConfig;
});
