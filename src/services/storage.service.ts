const StorageService = {
  getItem<T>(key: string): T | undefined {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch {
        // A corrupt entry would otherwise throw on every read, permanently
        // breaking its consumers (localStorage survives reloads). Drop it.
        localStorage.removeItem(key);
        return undefined;
      }
    }
    return undefined;
  },
  setItem<T>(key: string, data: T) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
  },
};

export { StorageService };
