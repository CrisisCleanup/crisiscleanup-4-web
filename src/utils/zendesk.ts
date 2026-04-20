import { loadScript, runWhenIdle } from './scriptLoader';

const ZENDESK_SRC =
  'https://static.zdassets.com/ekr/snippet.js?key=8ded7c6f-5e21-423d-bd23-75d1a3dfc46c';

let initialized = false;

export function loadZendeskWhenIdle(): void {
  if (initialized) return;
  initialized = true;
  (window as unknown as Record<string, unknown>).zESettings = {
    contactForm: { suppress: true },
  };
  runWhenIdle(() => {
    loadScript(ZENDESK_SRC, {
      id: 'ze-snippet',
      async: true,
      defer: true,
    }).catch(() => {
      initialized = false;
    });
  });
}
