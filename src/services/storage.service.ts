const StorageService = {
  getItem<T>(key: string): T | undefined {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
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
