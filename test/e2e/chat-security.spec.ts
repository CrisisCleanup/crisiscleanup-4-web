import { test, expect } from '@playwright/test';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

let script: string;
test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    css: { postcss: { plugins: [] } },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(
          new URL('../../src/utils/chat.ts', import.meta.url),
        ),
        name: 'chat',
        formats: ['iife'],
      },
    },
  });
  const bundle = Array.isArray(result) ? result[0] : result;
  if (!('output' in bundle)) throw new Error('Expected a JavaScript bundle');
  const chunk = bundle.output.find((output) => output.type === 'chunk');
  if (!chunk || !('code' in chunk)) throw new Error('Missing chat bundle');
  script = chunk.code;
});

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => route.abort());
  await page.setContent('<main id="message"></main>');
  await page.addScriptTag({ content: script });
});

test('chat preserves rich text and removes executable HTML', async ({
  page,
}) => {
  await page.evaluate(() => {
    const formatter = (
      window as unknown as {
        chat: { formatChatMessage: (html: string) => string };
      }
    ).chat;
    document.querySelector('#message')!.innerHTML = formatter.formatChatMessage(
      '<p><strong>Hello</strong><img src="https://example.com/photo.png" onerror="window.injected=true"></p><script>window.injected=true</script><a href="javascript:alert(1)">bad</a><svg onload="window.injected=true"></svg><span style="position:fixed">text</span>',
    );
  });
  await expect(page.locator('strong')).toHaveText('Hello');
  await expect(page.locator('img')).toHaveAttribute(
    'src',
    'https://example.com/photo.png',
  );
  await expect(
    page.locator(
      '#message [onerror], #message [onload], #message script, #message svg, #message [style]',
    ),
  ).toHaveCount(0);
  expect(await page.locator('a').getAttribute('href')).toBeNull();
  expect(await page.evaluate(() => 'injected' in window)).toBe(false);
});

test('chat links text URLs without changing links or image attributes', async ({
  page,
}) => {
  await page.evaluate(() => {
    const formatter = (
      window as unknown as {
        chat: { formatChatMessage: (html: string) => string };
      }
    ).chat;
    document.querySelector('#message')!.innerHTML = formatter.formatChatMessage(
      'Visit https://example.com/path?q=1&amp;x=2 <a href="https://example.org" target="_blank">https://example.org</a><img src="https://example.com/image.png"><code>https://example.com/code</code>',
    );
  });
  await expect(page.locator('a')).toHaveCount(2);
  await expect(page.locator('a').first()).toHaveAttribute(
    'href',
    'https://example.com/path?q=1&x=2',
  );
  await expect(page.locator('a').last()).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await expect(page.locator('a a, code a')).toHaveCount(0);
  await expect(page.locator('img')).toHaveAttribute(
    'src',
    'https://example.com/image.png',
  );
});

test('chat permits trusted video embeds and rejects arbitrary frames', async ({
  page,
}) => {
  await page.evaluate(() => {
    const formatter = (
      window as unknown as {
        chat: { formatChatMessage: (html: string) => string };
      }
    ).chat;
    document.querySelector('#message')!.innerHTML = formatter.formatChatMessage(
      '<iframe src="https://www.youtube.com/embed/abc" srcdoc="<script>parent.injected=true</script>" allow="camera"></iframe><iframe src="https://player.vimeo.com/video/123"></iframe><iframe src="https://example.com/embed/abc"></iframe><iframe src="https://www.youtube.com.evil.example/embed/abc"></iframe>',
    );
  });
  await expect(page.locator('iframe')).toHaveCount(2);
  await expect(page.locator('iframe[srcdoc], iframe[allow]')).toHaveCount(0);
  await expect(page.locator('iframe').first()).toHaveAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-presentation',
  );
  expect(await page.evaluate(() => 'injected' in window)).toBe(false);
});
