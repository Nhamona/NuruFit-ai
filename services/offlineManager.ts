
const DB_NAME = 'nuru_offline_db';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Error opening database");
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

export const saveVideo = async (url: string): Promise<void> => {
  if (!url || url.includes('youtube.com') || url.includes('youtu.be')) {
      return; // Skip YouTube videos
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
        const request = store.put({ url, blob, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
    
  } catch (error) {
    console.error(`Failed to download video: ${url}`, error);
    throw error;
  }
};

export const getVideo = async (url: string): Promise<string | null> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const result = await new Promise<{url: string, blob: Blob} | undefined>((resolve, reject) => {
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    if (result && result.blob) {
        return URL.createObjectURL(result.blob);
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const isVideoDownloaded = async (url: string): Promise<boolean> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        
        const count = await new Promise<number>((resolve, reject) => {
            const request = store.count(url);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        return count > 0;
    } catch (error) {
        return false;
    }
};

export const deleteVideo = async (url: string): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(url);
};
