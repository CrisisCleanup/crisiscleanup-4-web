import { openDB } from 'idb';

const WORKSITES_DATABASE = 'worksites';
const WORKSITE_IMAGES_DATABASE = 'worksite_images';
const USER_DATABASE = 'user';

const dbPromise = openDB('crisiscleanup', 7, {
  upgrade(db, oldVersion) {
    if (oldVersion > 0) {
      try {
        db.deleteObjectStore(WORKSITES_DATABASE);
      } catch {
        // Ignore
      }
      try {
        db.deleteObjectStore(WORKSITE_IMAGES_DATABASE);
      } catch {
        // Ignore
      }
      try {
        db.deleteObjectStore(USER_DATABASE);
      } catch {
        // Ignore
      }
    }

    db.createObjectStore(WORKSITES_DATABASE);
    db.createObjectStore(WORKSITE_IMAGES_DATABASE);
    db.createObjectStore(USER_DATABASE);
  },
});

const DbService = {
  async setItem(key: string, value: unknown, db = WORKSITES_DATABASE) {
    const idbpDatabase = await dbPromise;
    return idbpDatabase.put(db, value, key);
  },
  async getItem(key: string, db = WORKSITES_DATABASE): Promise<unknown> {
    const idbpDatabase = await dbPromise;
    const entry = (await idbpDatabase.get(db, key)) as string;
    if (entry) {
      try {
        return JSON.parse(entry) as Record<string, unknown>;
      } catch {
        return entry as unknown;
      }
    }

    return null;
  },
  async clearDatabase(db: string) {
    const idbpDatabase = await dbPromise;
    return idbpDatabase.clear(db);
  },
};

export {
  DbService,
  WORKSITES_DATABASE,
  WORKSITE_IMAGES_DATABASE,
  USER_DATABASE,
};
