import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  isOnline,
  onOnlineStatusChange,
  getPendingSync,
  clearPendingSync,
  addPendingSync,
  saveAppointmentsLocal,
  getAppointmentsLocal,
  saveSymptomsLocal,
  getSymptomsLocal,
  saveReadingsLocal,
  getReadingsLocal,
  saveRemindersLocal,
  getRemindersLocal,
  addLocalItem,
  deleteLocalItem,
  getLastSyncTime,
  setLastSyncTime,
} from "@/lib/offline-storage";
import { apiRequest } from "@/lib/queryClient";

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    return onOnlineStatusChange(setOnline);
  }, []);

  return online;
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const syncPendingItems = useCallback(async () => {
    if (!online || syncing) return;

    setSyncing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const pending = await getPendingSync().catch(err => {
        console.error("Failed to get pending sync items:", err);
        return [];
      });
      setPendingCount(pending.length);

      if (pending.length === 0) return;

      const sortedPending = [...pending].sort((a, b) => a.timestamp - b.timestamp);

      for (const item of sortedPending) {
        try {
          const endpoint = `/api/${item.type}s`;
          
          if (item.action === "create") {
            await apiRequest("POST", endpoint, item.data);
          } else if (item.action === "delete") {
            await apiRequest("DELETE", `${endpoint}/${item.data.id}`);
          }
          
          await clearPendingSync(item.id);
          successCount++;
        } catch (error) {
          console.error("Failed to sync item:", item, error);
          failCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/symptoms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/readings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });

      const updatedPending = await getPendingSync();
      setPendingCount(updatedPending.length);

      const now = Date.now();
      const status = failCount === 0 ? "success" : successCount > 0 ? "partial" : "failed";
      await setLastSyncTime(now, status);
      setLastSync(now);
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, queryClient]);

  const refreshFromServer = useCallback(async () => {
    if (!online || refreshing) return;

    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/symptoms"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/readings"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });

      await queryClient.refetchQueries({ queryKey: ["/api/appointments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/symptoms"] });
      await queryClient.refetchQueries({ queryKey: ["/api/readings"] });
      await queryClient.refetchQueries({ queryKey: ["/api/reminders"] });

      const now = Date.now();
      await setLastSyncTime(now, "success");
      setLastSync(now);
    } catch (error) {
      console.error("Failed to refresh from server:", error);
    } finally {
      setRefreshing(false);
    }
  }, [online, refreshing, queryClient]);

  useEffect(() => {
    if (online) {
      syncPendingItems();
    }
  }, [online, syncPendingItems]);

  useEffect(() => {
    getPendingSync()
      .then((pending) => setPendingCount(pending.length))
      .catch(err => console.error("Initial pending sync fetch failed:", err));
    getLastSyncTime()
      .then((time) => setLastSync(time))
      .catch(err => console.error("Initial last sync time fetch failed:", err));
  }, []);

  return { 
    syncing, 
    pendingCount, 
    lastSync,
    refreshing,
    syncNow: syncPendingItems,
    refreshFromServer,
  };
}

export function useOfflineAppointments() {
  const online = useOnlineStatus();

  const cacheAppointments = useCallback(async (appointments: any[]) => {
    await saveAppointmentsLocal(appointments);
  }, []);

  const getOfflineAppointments = useCallback(async () => {
    return getAppointmentsLocal();
  }, []);

  const addOfflineAppointment = useCallback(async (data: any) => {
    const tempId = -Date.now();
    const tempAppointment = { ...data, id: tempId };
    await addLocalItem("appointments", tempAppointment);
    await addPendingSync({ type: "appointment", action: "create", data });
    return tempAppointment;
  }, []);

  return { online, cacheAppointments, getOfflineAppointments, addOfflineAppointment };
}

export function useOfflineSymptoms() {
  const online = useOnlineStatus();

  const cacheSymptoms = useCallback(async (symptoms: any[]) => {
    await saveSymptomsLocal(symptoms);
  }, []);

  const getOfflineSymptoms = useCallback(async () => {
    return getSymptomsLocal();
  }, []);

  const addOfflineSymptom = useCallback(async (data: any) => {
    const tempId = -Date.now();
    const tempSymptom = { ...data, id: tempId };
    await addLocalItem("symptoms", tempSymptom);
    await addPendingSync({ type: "symptom", action: "create", data });
    return tempSymptom;
  }, []);

  const deleteOfflineSymptom = useCallback(async (id: number) => {
    await deleteLocalItem("symptoms", id);
    if (id > 0) {
      await addPendingSync({ type: "symptom", action: "delete", data: { id } });
    }
  }, []);

  return { online, cacheSymptoms, getOfflineSymptoms, addOfflineSymptom, deleteOfflineSymptom };
}

export function useOfflineReadings() {
  const online = useOnlineStatus();

  const cacheReadings = useCallback(async (readings: any[]) => {
    await saveReadingsLocal(readings);
  }, []);

  const getOfflineReadings = useCallback(async () => {
    return getReadingsLocal();
  }, []);

  const addOfflineReading = useCallback(async (data: any) => {
    const tempId = -Date.now();
    const tempReading = { ...data, id: tempId };
    await addLocalItem("readings", tempReading);
    await addPendingSync({ type: "reading", action: "create", data });
    return tempReading;
  }, []);

  const deleteOfflineReading = useCallback(async (id: number) => {
    await deleteLocalItem("readings", id);
    if (id > 0) {
      await addPendingSync({ type: "reading", action: "delete", data: { id } });
    }
  }, []);

  return { online, cacheReadings, getOfflineReadings, addOfflineReading, deleteOfflineReading };
}

export function useOfflineReminders() {
  const online = useOnlineStatus();

  const cacheReminders = useCallback(async (reminders: any[]) => {
    await saveRemindersLocal(reminders);
  }, []);

  const getOfflineReminders = useCallback(async () => {
    return getRemindersLocal();
  }, []);

  return { online, cacheReminders, getOfflineReminders };
}
