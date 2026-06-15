// src/store/useStore.ts
import create from 'zustand';
import { devtools } from 'zustand/middleware';

export type Task = {
  id: string;
  title: string;
  patient: string;
  distance: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  eta: string;
};

export type SOSAlert = {
  id: string;
  patient: string;
  location: string;
  status: 'Pending' | 'Assigned' | 'En Route' | 'Reached' | 'Closed';
  timestamp: string;
};

export type SyncStatus = {
  offline: boolean;
  pending: number;
  failed: number;
  lastSync: string;
};

type StoreState = {
  tasks: Task[];
  sosAlerts: SOSAlert[];
  sync: SyncStatus;
  addTask: (task: Task) => void;
  addSOS: (alert: SOSAlert) => void;
  setSync: (status: Partial<SyncStatus>) => void;
};

export const useStore = create<StoreState>()(
  devtools((set) => ({
    tasks: [],
    sosAlerts: [],
    sync: { offline: false, pending: 0, failed: 0, lastSync: '' },
    addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
    addSOS: (alert) => set((s) => ({ sosAlerts: [...s.sosAlerts, alert] })),
    setSync: (status) => set((s) => ({ sync: { ...s.sync, ...status } })),
  }))
);
