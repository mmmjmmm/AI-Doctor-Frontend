import type { TaskType } from "@/types/chat";

export type TaskEntryKey =
  | "report_interpret"
  | "open_app"
  | "body_part"
  | "ingredient"
  | "drug"
  | "doctor_reco"
  | "history";

export type TaskRuntimeStatus =
  | "idle"
  | "sending_user_message"
  | "uploading_image"
  | "vision_analyzing"
  | "ai_streaming"
  | "ai_waiting_card"
  | "error";

export interface PendingTask {
  task_id: string;
  session_id: string;
  task_type: TaskType;
  entry_key: TaskEntryKey;
  created_at: string;
  image_count?: number;
  user_message_id?: string;
  assistant_message_id?: string;
}

export interface TaskContextImage {
  file_id: string;
  url?: string;
}

export interface TaskContext {
  task_type: TaskType;
  entry: "quick_tool" | "composer" | "history_retry";
  images?: TaskContextImage[];
  extra?: Record<string, unknown>;
}
