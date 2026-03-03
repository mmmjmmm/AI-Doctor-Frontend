/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "@/utils/request";
import type { TaskEntryKey } from "@/types/task";

export type LegacyToolKey =
  | "report"
  | "download"
  | "photo"
  | "doctor"
  | "medicine";

export interface AppTool {
  key: TaskEntryKey | LegacyToolKey;
  title: string;
  icon: string;
  trigger_mode?: "pick_image" | "send_message" | "deeplink" | "route";
  preset_text?: string;
}

export interface AppConfig {
  disclaimer: {
    top_bar: string;
    bottom_hint: string;
  };
  tools: AppTool[];
  limits: {
    text_max_len: number;
    send_rate_limit_ms: number;
    image_max_mb: number;
    upload_timeout_s: number;
    image_max_count?: number;
  };
  app_link?: {
    scheme_url: string;
    download_url: string;
    app_store_url?: string;
    yingyongbao_url?: string;
  };
}

export const getAppConfig = async () => {
  const response = await request.get<any, AppConfig>("/app/config");
  return response;
};
