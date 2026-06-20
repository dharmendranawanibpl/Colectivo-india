// LocalStorage & In-memory Reactive Data Store mimicking Firestore API
// Fully offline, zero dependencies on third-party Firebase services!

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const db = {};

const STORAGE_PREFIX = 'colectivo_local_db_';

function getStorageKey(col: string, id: string) {
  return `${STORAGE_PREFIX}${col}:${id}`;
}

// Global active sub list
type ListenerCallback = (snapshot: any) => void;
const listeners = new Set<{
  target: { collection: string; id?: string };
  cb: ListenerCallback;
}>();

export function notifyListeners(col: string, id?: string) {
  listeners.forEach(listener => {
    if (listener.target.collection === col) {
      if (!listener.target.id || listener.target.id === id) {
        if (listener.target.id) {
          getDoc({ collection: col, id: listener.target.id }).then(snap => {
            listener.cb(snap);
          });
        } else {
          getDocs({ collection: col }).then(snap => {
            listener.cb(snap);
          });
        }
      }
    }
  });
}

// Mock Firestore structural objects
export function collection(dbInstance: any, collectionName: string) {
  return { collection: collectionName };
}

export function doc(dbInstance: any, collectionName: string, docId: string) {
  return { collection: collectionName, id: docId };
}

export async function setDoc(docInput: { collection: string; id: string }, data: any, options?: { merge?: boolean }) {
  const key = getStorageKey(docInput.collection, docInput.id);
  const existing = localStorage.getItem(key);
  let finalData = data;
  
  if (existing && options?.merge) {
    try {
      finalData = { ...JSON.parse(existing), ...data };
    } catch (e) {
      finalData = data;
    }
  }
  
  localStorage.setItem(key, JSON.stringify(finalData));
  notifyListeners(docInput.collection, docInput.id);
  return true;
}

export async function getDoc(docInput: { collection: string; id: string }) {
  const key = getStorageKey(docInput.collection, docInput.id);
  const val = localStorage.getItem(key);
  return {
    exists: () => val !== null,
    data: () => (val ? JSON.parse(val) : null),
  };
}

export async function getDocs(collectionInput: { collection: string }) {
  const keys = Object.keys(localStorage);
  const prefix = `${STORAGE_PREFIX}${collectionInput.collection}:`;
  const filteredKeys = keys.filter(k => k.startsWith(prefix));
  
  const docs = filteredKeys.map(k => {
    const raw = localStorage.getItem(k);
    const id = k.replace(prefix, '');
    return {
      id,
      data: () => (raw ? JSON.parse(raw) : null),
    };
  });

  return {
    empty: docs.length === 0,
    forEach: (callback: (doc: any) => void) => {
      docs.forEach(doc => callback(doc));
    }
  };
}

export function onSnapshot(
  target: { collection: string; id?: string },
  callback: ListenerCallback,
  errorCallback?: (error: any) => void
) {
  const item = { target, cb: callback };
  listeners.add(item);

  // Instant trigger to sync with existing state
  if (target.id) {
    getDoc({ collection: target.collection, id: target.id }).then(snap => {
      callback(snap);
    }).catch(err => errorCallback?.(err));
  } else {
    getDocs({ collection: target.collection }).then(snap => {
      callback(snap);
    }).catch(err => errorCallback?.(err));
  }

  // Pure clean unsubscribe function
  return () => {
    listeners.delete(item);
  };
}

export async function saveDocument(colName: string, docId: string, data: any) {
  return setDoc({ collection: colName, id: docId }, data, { merge: true });
}

export async function deleteDocument(colName: string, docId: string) {
  const key = getStorageKey(colName, docId);
  localStorage.removeItem(key);
  notifyListeners(colName, docId);
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.log('Synchronous local database action:', operationType, path, error);
}
