export function getQueryString(parameters: Record<string, any>) {
  return Object.keys(parameters)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`,
    )
    .join('&');
}

export function getUserAvatarLink(name: string) {
  return (
    'https://api.dicebear.com/7.x/bottts/svg?seed=' +
    name.trim().split(/\s+/)[0]
  );
}
