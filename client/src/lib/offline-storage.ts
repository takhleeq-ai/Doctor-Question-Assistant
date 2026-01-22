import type { Appointment, Symptom, Reading, Reminder } from "@shared/schema";

const DB_NAME = "healthprep-offline";
const DB_VERSION = 2;

interface PendingSync {
  id: string;
  type: "appointment" | "symptom" | "reading" | "reminder";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: number;
}

interface SyncMetadata {
  id: string;
  lastSyncTime: number;
  lastSyncStatus: "success" | "partial" | "failed";
}

let db: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB open error:", request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      db = request.result;
      db.onversionchange = () => {
        db?.close();
        db = null;
        window.location.reload();
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains("appointments")) {
        database.createObjectStore("appointments", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("symptoms")) {
        database.createObjectStore("symptoms", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("readings")) {
        database.createObjectStore("readings", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("reminders")) {
        database.createObjectStore("reminders", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("pendingSync")) {
        database.createObjectStore("pendingSync", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("syncMetadata")) {
        database.createObjectStore("syncMetadata", { keyPath: "id" });
      }
    };
  });
}

async function getStore(storeName: string, mode: IDBTransactionMode = "readonly") {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

export async function saveToLocal<T extends { id: number }>(
  storeName: string,
  items: T[]
): Promise<void> {
  const store = await getStore(storeName, "readwrite");
  items.forEach((item) => store.put(item));
}

export async function getFromLocal<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingSync(sync: Omit<PendingSync, "id" | "timestamp">): Promise<void> {
  const store = await getStore("pendingSync", "readwrite");
  const pendingItem: PendingSync = {
    ...sync,
    id: `${sync.type}-${sync.action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  store.add(pendingItem);
}

export async function getPendingSync(): Promise<PendingSync[]> {
  return getFromLocal<PendingSync>("pendingSync");
}

export async function clearPendingSync(id: string): Promise<void> {
  const store = await getStore("pendingSync", "readwrite");
  store.delete(id);
}

export async function clearAllPendingSync(): Promise<void> {
  const store = await getStore("pendingSync", "readwrite");
  store.clear();
}

export async function saveAppointmentsLocal(appointments: Appointment[]): Promise<void> {
  return saveToLocal("appointments", appointments);
}

export async function getAppointmentsLocal(): Promise<Appointment[]> {
  return getFromLocal<Appointment>("appointments");
}

export async function saveSymptomsLocal(symptoms: Symptom[]): Promise<void> {
  return saveToLocal("symptoms", symptoms);
}

export async function getSymptomsLocal(): Promise<Symptom[]> {
  return getFromLocal<Symptom>("symptoms");
}

export async function saveReadingsLocal(readings: Reading[]): Promise<void> {
  return saveToLocal("readings", readings);
}

export async function getReadingsLocal(): Promise<Reading[]> {
  return getFromLocal<Reading>("readings");
}

export async function saveRemindersLocal(reminders: Reminder[]): Promise<void> {
  return saveToLocal("reminders", reminders);
}

export async function getRemindersLocal(): Promise<Reminder[]> {
  return getFromLocal<Reminder>("reminders");
}

export async function addLocalItem<T extends { id: number }>(
  storeName: string,
  item: T
): Promise<void> {
  const store = await getStore(storeName, "readwrite");
  store.put(item);
}

export async function deleteLocalItem(storeName: string, id: number): Promise<void> {
  const store = await getStore(storeName, "readwrite");
  store.delete(id);
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export async function getLastSyncTime(): Promise<number | null> {
  try {
    const store = await getStore("syncMetadata");
    return new Promise((resolve) => {
      const request = store.get("lastSync");
      request.onsuccess = () => {
        const result = request.result as SyncMetadata | undefined;
        resolve(result?.lastSyncTime || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setLastSyncTime(time: number, status: "success" | "partial" | "failed"): Promise<void> {
  try {
    const store = await getStore("syncMetadata", "readwrite");
    const metadata: SyncMetadata = {
      id: "lastSync",
      lastSyncTime: time,
      lastSyncStatus: status,
    };
    store.put(metadata);
  } catch (error) {
    console.error("Failed to save sync metadata:", error);
  }
}

export async function getSyncStatus(): Promise<SyncMetadata | null> {
  try {
    const store = await getStore("syncMetadata");
    return new Promise((resolve) => {
      const request = store.get("lastSync");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
