import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { PendingTask, TaskRuntimeStatus } from "@/types/task";

interface TaskState {
  runtimeStatusBySession: Record<string, TaskRuntimeStatus>;
  pendingTaskBySession: Record<string, PendingTask | null>;
}

interface TaskActions {
  setRuntimeStatus: (sessionId: string, status: TaskRuntimeStatus) => void;
  setPendingTask: (sessionId: string, task: PendingTask | null) => void;
  clearTaskState: (sessionId: string) => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>()(
  immer((set) => ({
    runtimeStatusBySession: {},
    pendingTaskBySession: {},

    setRuntimeStatus: (sessionId, status) =>
      set((state) => {
        if (status === "idle") {
          delete state.runtimeStatusBySession[sessionId];
          return;
        }
        state.runtimeStatusBySession[sessionId] = status;
      }),

    setPendingTask: (sessionId, task) =>
      set((state) => {
        if (!task) {
          delete state.pendingTaskBySession[sessionId];
          return;
        }
        state.pendingTaskBySession[sessionId] = task;
      }),

    clearTaskState: (sessionId) =>
      set((state) => {
        delete state.runtimeStatusBySession[sessionId];
        delete state.pendingTaskBySession[sessionId];
      }),
  })),
);
