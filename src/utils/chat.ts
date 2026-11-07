import DOMPurify from 'dompurify';

export function formatChatMessage(content: string): string {
  const fragment = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['style', 'srcdoc', 'allow'],
    ADD_ATTR: ['target'],
    ADD_TAGS: ['iframe'],
  });
  // NodeList iteration must work without the DOM.Iterable TypeScript library.
  // eslint-disable-next-line unicorn/no-array-for-each
  fragment.querySelectorAll('iframe').forEach((frame) => {
    const src = frame.getAttribute('src') || '';
    const isVideoEmbed =
      /^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[\w-]+(?:[#/?]|$)/.test(
        src,
      ) || /^https:\/\/player\.vimeo\.com\/video\/\d+(?:[#/?]|$)/.test(src);
    if (isVideoEmbed) {
      frame.setAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-presentation',
      );
      frame.setAttribute('referrerpolicy', 'no-referrer');
    } else {
      frame.remove();
    }
  });
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement?.closest('a, pre, code')) textNodes.push(node);
  }
  for (const node of textNodes) {
    const text = node.textContent || '';
    const matches = [...text.matchAll(/https?:\/\/[^\s"'<>]+/g)];
    if (matches.length === 0) continue;
    const replacement = document.createDocumentFragment();
    let start = 0;
    for (const match of matches) {
      replacement.append(text.slice(start, match.index));
      const link = document.createElement('a');
      link.href = match[0];
      link.textContent = match[0];
      link.target = '_blank';
      link.className =
        'text-crisiscleanup-dark-blue underline underline-offset-2 hover:opacity-80';
      replacement.append(link);
      start = match.index + match[0].length;
    }
    replacement.append(text.slice(start));
    node.replaceWith(replacement);
  }
  // eslint-disable-next-line unicorn/no-array-for-each -- See the NodeList loop above.
  fragment.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer');
  });
  const container = document.createElement('div');
  container.append(fragment);
  return container.innerHTML;
}
