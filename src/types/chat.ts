export type MessageRole = "user" | "assistant" | "system";
export type MessageType = "text" | "image" | "card" | "status";
export type MessageStatus =
  | "sending"
  | "sent"
  | "failed"
  | "deleted"
  | "interrupted";
export type FeedbackStatus = "none" | "liked" | "disliked";
export type TaskType =
  | "chat"
  | "report_interpret"
  | "body_part"
  | "ingredient"
  | "drug";
export type MessageThinkingStatus = "none" | "thinking" | "done";

// 富文本块定义
export type ContentRichBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

// 问诊卡片数据结构
export interface IntakeFormCard {
  card_type: "intake_form";
  title: string;
  options: { key: string; label: string }[];
  allow_multi: boolean;
  free_text: { enabled: boolean; placeholder: string; max_len: number };
  submit: { action: "send_message"; button_text: string };
}

// 下载引导卡片数据结构
export interface DownloadCard {
  card_type: "download_app";
  title?: string;
  sub_title?: string;
  content?: string;
  icon_url: string;
  image_url?: string;
  cta: { text: string; action: "download" };
}

// 咨询总结卡片数据结构
export interface ConsultSummaryCardData {
  card_type: "consult_summary";
  hint?: string;
  title: string;
  summary: string;
  patient_info: {
    title: string;
    items: { label: string; value: string }[];
  };
  advice_list: {
    title: string;
    content: string;
  }[];
  footer?: {
    disclaimer?: string;
  };
}

// 消息附件
export interface Attachment {
  attachment_id: string;
  type: "image";
  url: string;
  meta?: {
    width?: number;
    height?: number;
    size?: number;
    upload_progress?: number;
  };
}

export interface MessageFoldMeta {
  enabled: boolean;
  collapsed: boolean;
  collapsed_lines?: number;
}

export interface MessageActionMeta {
  can_copy?: boolean;
  can_regenerate?: boolean;
  can_like?: boolean;
  can_dislike?: boolean;
  can_share?: boolean;
}

// 消息主体
export interface Message {
  message_id: string;
  session_id: string;
  role: MessageRole;
  type: MessageType;
  content: string; // 纯文本或 Markdown
  content_rich?: { blocks: ContentRichBlock[] } | null;
  attachments?: Attachment[];
  created_at: string;
  status: MessageStatus;
  feedback_status?: FeedbackStatus;
  disclaimer_bottom?: string;
  // 卡片数据
  card?: IntakeFormCard | DownloadCard | ConsultSummaryCardData;
  task_type?: TaskType;
  thinking_status?: MessageThinkingStatus;
  fold_meta?: MessageFoldMeta;
  action_meta?: MessageActionMeta;
  client_only?: boolean;
  error_message?: string;
}

// 会话主体
export interface Session {
  session_id: string;
  status: "active" | "ended";
  started_at: string;
  ended_at?: string | null;
  title?: string;
  entry_source?: string;
}
