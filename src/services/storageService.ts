import type { SongMetadata, LyricLine } from '../types/lyrics';

export interface StoredSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  audioBlob?: Blob;
  audioUrl?: string; // for remote demo songs
  coverBlob?: Blob;
  coverUrl?: string;
  isLocal: boolean;
  lyrics: LyricLine[];
  isTranslated: boolean;
  isFavorite?: boolean;
  createdAt: number;
}

const DB_NAME = 'LyricFlowDB';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves or updates a song in IndexedDB permanently
 */
export async function saveSongToDB(song: StoredSong): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(song);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all stored songs from IndexedDB
 */
export async function getAllSongsFromDB(): Promise<StoredSong[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const songs: StoredSong[] = request.result || [];
      // Sort newest first
      resolve(songs.sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes a song from IndexedDB
 */
export async function deleteSongFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Updates lyrics for an existing song in IndexedDB
 */
export async function updateSongLyricsInDB(id: string, lyrics: LyricLine[], isTranslated: boolean): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: StoredSong | undefined = getReq.result;
      if (item) {
        item.lyrics = lyrics;
        item.isTranslated = isTranslated;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Toggles favorite status for a stored song in IndexedDB
 */
export async function toggleSongFavoriteInDB(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: StoredSong | undefined = getReq.result;
      if (item) {
        const nextFav = !item.isFavorite;
        item.isFavorite = nextFav;
        store.put(item);
        resolve(nextFav);
      } else {
        resolve(false);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Converts a StoredSong to SongMetadata with valid object URLs for playback and cover
 */
export function convertStoredSongToMetadata(song: StoredSong): { metadata: SongMetadata; audioUrl: string } {
  let audioUrl = song.audioUrl || '';
  if (song.audioBlob) {
    audioUrl = URL.createObjectURL(song.audioBlob);
  }

  let coverUrl = song.coverUrl;
  if (song.coverBlob) {
    coverUrl = URL.createObjectURL(song.coverBlob);
  }

  return {
    metadata: {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: coverUrl,
      audioUrl: audioUrl,
      isLocal: song.isLocal,
    },
    audioUrl,
  };
}
