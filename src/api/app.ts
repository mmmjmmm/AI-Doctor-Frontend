/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "@/utils/request";

export interface AppConfig {
  disclaimer: {
    top_bar: string;
    bottom_hint: string;
  };
  tools: Array<{
    key: string;
    title: string;
    icon: string;
  }>;
  limits: {
    text_max_len: number;
    send_rate_limit_ms: number;
    image_max_mb: number;
    upload_timeout_s: number;
  };
}

export const getAppConfig = async () => {
  const response = await request.get<any, AppConfig>("/app/config");
  return response;
};
