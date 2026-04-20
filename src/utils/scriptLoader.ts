const loadedScripts = new Map<string, Promise<HTMLScriptElement>>();

interface ScriptAttrs {
  id?: string;
  async?: boolean;
  defer?: boolean;
  crossOrigin?: string;
}

export function loadScript(
  src: string,
  attrs: ScriptAttrs = {},
): Promise<HTMLScriptElement> {
  let p = loadedScripts.get(src);
  if (p) return p;

  p = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      resolve(existing);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    if (attrs.id) s.id = attrs.id;
    if (attrs.async) s.async = true;
    if (attrs.defer) s.defer = true;
    if (attrs.crossOrigin) s.crossOrigin = attrs.crossOrigin;
    s.addEventListener('load', () => resolve(s));
    s.addEventListener('error', () =>
      reject(new Error(`Failed to load script: ${src}`)),
    );
    document.head.append(s);
  });
  loadedScripts.set(src, p);
  return p;
}

export function loadStylesheet(href: string): void {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.append(l);
}

export function runWhenIdle(fn: () => void, timeoutMs = 2000): void {
  const ric = (
    window as typeof window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
    }
  ).requestIdleCallback;
  if (ric) {
    ric(fn, { timeout: timeoutMs });
  } else {
    setTimeout(fn, 1);
  }
}
