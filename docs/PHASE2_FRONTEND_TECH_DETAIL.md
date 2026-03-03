# AI 医生问答 H5 二期前端技术细节文档

- 文档版本：V2.0
- 适用范围：`apps/frontend`
- 编写依据：
  - `/docs/PRD-v2.md`
  - 当前前端实现
- 目标：把二期前端建设拆解到页面、组件、类型、状态机、接口和开发顺序，保证后续开发可以直接按文档落地。

---

## 1. 当前项目现状

### 1.1 技术栈

- 构建：Vite 5
- 框架：React 18 + TypeScript
- 路由：React Router 6
- 状态：Zustand + Immer
- 请求：Axios
- 服务端状态：TanStack Query
- UI：`antd-mobile` + Tailwind CSS
- 富文本：`markdown-it` + `dompurify`
- 流式协议：SSE `EventSource`

### 1.2 当前已经具备的能力

#### 1.2.1 路由与壳层

- `src/router/index.tsx`
  - 已有 `/chat` 和 `/chat/:sessionId`
- `src/layouts/AppShell.tsx`
  - 已提供移动端容器壳层
  - 已做 `max-w-md` 约束，适合 H5/WebView

#### 1.2.2 对话页主流程

- `src/pages/ChatPage.tsx`
  - 已接入 app 配置拉取
  - 已支持自动创建会话
  - 已支持按 `sessionId` 加载历史详情
  - 已支持文本消息发送
  - 已支持 SSE `delta / done / error`
  - 已支持将 assistant 文本与 card 混合插入消息流

#### 1.2.3 消息渲染体系

- `src/components/chat/ChatMessageList.tsx`
  - 已支持 user / assistant 分组渲染
  - 已支持 `text` 和 `card`
  - 已按卡片类型分发：
    - `intake_form`
    - `download_app`
    - `consult_summary`
- `src/components/chat/cards/AssistantMessageCard.tsx`
  - 已支持 markdown / rich block 渲染
- `src/components/chat/cards/IntakeFormCard.tsx`
  - 已支持单选、多选、自由补充、提交后发消息

#### 1.2.4 会话与配置状态

- `src/store/useChatStore.ts`
  - 当前维护：
    - `activeSessionId`
    - `messagesBySession`
    - `generatingBySession`
- `src/store/useAppStore.ts`
  - 当前维护服务端下发的 `config`

#### 1.2.5 当前二期缺口

- 没有图片选择、拍照、上传、失败重试
- 没有图像任务状态机
- 快捷入口点击后除历史外都是占位行为
- 没有打开 App 的深链和兜底页
- 消息类型对“上传态、分析态、中断态、思考态、折叠态”支持不足

---

## 2. 二期建设目标

### 2.1 业务目标

- 让用户通过快捷入口直接发起任务，而不是依赖纯文本输入
- 建成统一的“图片任务链路”
- 保持二期仍然复用一期会话、消息流、卡片分发能力
- 对后续三期保留扩展空间，不做一次性写死

### 2.2 前端目标

- 所有入口统一走同一套调度层
- 文本任务和图片任务统一进入消息流
- 明确并发规则，避免“正在输出时再次触发任务”导致状态错乱
- 类型设计先保证兼容当前接口，再为二期扩展预留字段

---

## 3. 二期总体前端架构

### 3.1 分层原则

- `pages/`
  - 负责页面编排、路由参数、副作用生命周期
- `components/`
  - 负责渲染和交互，不承担跨页面状态
- `api/`
  - 只定义请求函数和响应类型
- `store/`
  - 负责会话态、任务态、上传态、本地消息态
- `types/`
  - 统一定义消息、任务、上传、平台等业务类型
- `utils/`
  - 平台判断、图片压缩、deep link、SSE/上传中断等纯工具逻辑

### 3.2 核心设计原则

- 优先复用 `ChatPage` 作为任务承载页
- 优先扩展现有 `Message`，不要平行造第二套消息模型
- 二期任务入口统一抽象为 `TaskEntry`
- 图片任务统一抽象为 `VisionTask`
- 就医推荐本期直接复用普通问答主链路

---

## 4. 目录改造建议

```text
src/
  api/
    app.ts
    history.ts
    message.ts                # 扩展，支持 task_context
    session.ts
    upload.ts                 # 新增。封装 /api/upload/image
  components/
    BottomToolsBar.tsx
    Composer.tsx
    HistoryDrawer.tsx
    uploader/
      ImagePickerSheet.tsx    # 新增。拍照/相册动作面板
      UploadPreviewBubble.tsx # 新增。图片上传态气泡
      ImageThumbGrid.tsx      # 新增。多图缩略图网格
    task/
      TaskActionGuard.tsx     # 新增。并发冲突确认弹层
    chat/
      ChatMessageList.tsx
      base/
        MessageStatusBadge.tsx    # 新增。深度思考中/已完成思考/已停止生成
        FoldableSection.tsx       # 新增。长文本折叠
      cards/
        AssistantMessageCard.tsx
        ConsultSummaryCard.tsx
        DownloadAppCard.tsx
        IntakeFormCard.tsx
        OpenAppUpsellCard.tsx     # 新增，二期重点
  pages/
    ChatPage.tsx
    OpenAppPage.tsx           # 新增
  store/
    useAppStore.ts
    useChatStore.ts           # 扩展
    useTaskStore.ts           # 新增
  types/
    chat.ts                   # 扩展
    task.ts                   # 新增
    upload.ts                 # 新增
    app.ts                    # 新增，可选
  utils/
    deepLink.ts               # 新增
    image.ts                  # 新增
    platform.ts               # 新增
    stream.ts                 # 新增，可选
```

---

## 5. 路由设计

### 5.1 当前路由

- `/chat`
- `/chat/:sessionId`

### 5.2 二期新增路由

- `/open-app`

### 5.3 路由职责

#### `/chat`

- 统一承接：
  - 普通对话
  - 就医推荐入口触发
  - 报告解读
  - 拍患处
  - 拍成分
  - 拍药品

#### `/open-app`

- 深链失败后的兜底下载页

---

## 6. 类型系统设计

本节是二期最重要的内容之一。所有后续组件和接口都必须围绕这些类型展开。

### 6.1 现有类型问题

当前 `src/types/chat.ts` 能支撑一期，但不足以表达以下场景：

- 用户图片消息上传中
- 图片上传失败并可重试
- AI 视觉分析进行中
- AI 输出被中断
- 文本内容可折叠
- 图片任务来自哪个入口
- 打开 App 引导的来源策略

### 6.2 `src/types/chat.ts` 扩展建议

```ts
export type MessageRole = "user" | "assistant" | "system";

export type MessageType =
  | "text"
  | "image"
  | "card"
  | "status";

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

export type MessageThinkingStatus =
  | "thinking"
  | "done"
  | "none";

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

export interface AttachmentImageMeta {
  width?: number;
  height?: number;
  size?: number;
  local_preview_url?: string;
  upload_progress?: number;
}

export interface Attachment {
  attachment_id: string;
  type: "image";
  url: string;
  meta?: AttachmentImageMeta;
}

export interface Message {
  message_id: string;
  session_id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  content_rich?: { blocks: ContentRichBlock[] } | null;
  attachments?: Attachment[];
  created_at: string;
  status: MessageStatus;
  feedback_status?: FeedbackStatus;
  disclaimer_bottom?: string;
  card?: MessageCard;

  // 二期扩展
  task_type?: TaskType;
  thinking_status?: MessageThinkingStatus;
  fold_meta?: MessageFoldMeta;
  action_meta?: MessageActionMeta;
  client_only?: boolean;
  error_message?: string;
}
```

### 6.3 新增 `src/types/task.ts`

```ts
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
  url: string;
}

export interface TaskContext {
  task_type: TaskType;
  entry: "quick_tool" | "composer" | "history_retry";
  images?: TaskContextImage[];
  extra?: Record<string, unknown>;
}
```

### 6.4 新增 `src/types/upload.ts`

```ts
export interface LocalImageAsset {
  local_id: string;
  file: File;
  preview_url: string;
  size: number;
  width?: number;
  height?: number;
}

export interface UploadImageResponse {
  file_id: string;
  url: string;
  width?: number;
  height?: number;
  size?: number;
}
```

### 6.5 卡片类型拆分建议

当前 `Message["card"]` 联合类型建议统一命名：

```ts
export type MessageCard =
  | IntakeFormCard
  | DownloadCard
  | ConsultSummaryCardData
  | OpenAppUpsellCardData;
```

新增：

```ts
export interface OpenAppUpsellCardData {
  card_type: "open_app_upsell";
  title: string;
  sub_title?: string;
  tabs: Array<{
    key: "record" | "report" | "prescription";
    label: string;
    examples: string[];
  }>;
  cta: {
    text: string;
    action: "open_app";
  };
}
```

说明：

- 二期卡片扩展只围绕问诊补充卡和 App 引导卡，不引入医生专属卡片协议

---

## 7. Store 设计

### 7.1 `useChatStore` 扩展

当前 `useChatStore` 能力不足以管理图片任务和中断状态。建议扩展如下：

```ts
interface ChatState {
  activeSessionId: string | null;
  messagesBySession: Record<string, Message[]>;
  generatingBySession: Record<string, boolean>;
  streamingMessageIdBySession: Record<string, string | null>;
}

interface ChatActions {
  setActiveSessionId: (sessionId: string | null) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (
    sessionId: string,
    messageId: string,
    updater: (msg: Message) => void,
  ) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  clearMessages: (sessionId: string) => void;
  setSessionGenerating: (sessionId: string, isGenerating: boolean) => void;
  setStreamingMessageId: (
    sessionId: string,
    messageId: string | null,
  ) => void;
  interruptAssistantMessage: (sessionId: string, messageId: string) => void;
}
```

### 7.2 新增 `useTaskStore`

用途：

- 管理当前会话的运行态，而不是把所有任务状态硬塞进 `useChatStore`
- 管理并发冲突确认
- 管理上传任务取消

建议结构：

```ts
interface TaskState {
  runtimeStatusBySession: Record<string, TaskRuntimeStatus>;
  pendingTaskBySession: Record<string, PendingTask | null>;
}

interface TaskActions {
  setRuntimeStatus: (
    sessionId: string,
    status: TaskRuntimeStatus,
  ) => void;
  setPendingTask: (
    sessionId: string,
    task: PendingTask | null,
  ) => void;
  clearTaskState: (sessionId: string) => void;
}
```

### 7.3 为什么拆 `useTaskStore`

- `ChatStore` 只应该管理消息视图状态
- `TaskStore` 负责运行态和并发调度
- 后续如果增加语音、问卷、处方拍照，任务维度会继续膨胀，独立 store 更稳

---

## 8. API 设计

### 8.1 现有接口

- `GET /app/config`
- `POST /session/create`
- `POST /message/send`
- `GET /history/list`
- `GET /history/detail`
- `POST /history/delete`
- `POST /history/batch_delete`

### 8.2 与后端接口文档的对齐结论

- 图像上传接口统一按 `POST /api/upload/image` 实现，前端文件名保持 `src/api/upload.ts`
- 图像任务不新增独立业务接口，上传后继续通过 `POST /message/send` 发起分析
- `message/send` 二期以 `task_context + attachment_ids` 为准
- 新增 `POST /message/stop` 作为中断当前任务的正式接口
- App 唤起配置当前统一从 `GET /app/config` 获取
- `GET /history/detail` 需要支持恢复图片消息、卡片消息和必要任务标识
- `GET /app/config.tools` 需要支持 `trigger_mode` 和 `preset_text`
- 就医推荐继续按普通文本消息处理，不新增医生专属接口

### 8.3 二期需要扩展的接口

#### 8.3.1 上传接口

文件：`src/api/upload.ts`

```ts
export interface UploadImageRequest {
  file: File;
  biz: "report_interpret" | "body_part" | "ingredient" | "drug";
}

export interface UploadImageResponse {
  file_id: string;
  url: string;
  width?: number;
  height?: number;
  size?: number;
}
```

建议前端封装：

- `uploadImage(file, biz)`，底层调用 `POST /api/upload/image`
- 可选支持 `AbortController`

#### 8.3.2 发送消息接口扩展

文件：`src/api/message.ts`

建议扩展 `SendMessageRequest`：

```ts
export interface SendMessageRequest {
  session_id: string;
  client_message_id: string;
  content: string;
  task_context?: TaskContext;
  attachment_ids?: string[];
}
```

说明：

- 图片任务必须带 `task_context.task_type`
- 图片任务必须带 `attachment_ids`
- 图片任务通过 `task_context.images` 传递上传结果：

```ts
task_context: {
  task_type: "report_interpret",
  entry: "quick_tool",
  images: [
    {
      file_id: "xxx",
      url: "https://..."
    }
  ]
}
```

- `attachment_ids` 是后端校验附件归属和 ready 状态的主依据：

```ts
attachment_ids: ["file_001"]
```

- 就医推荐入口不需要专门任务类型，直接发送普通文本消息即可：
  - `content = "帮我找医生"`

#### 8.3.3 停止生成接口

文件：`src/api/message.ts`

建议新增：

```ts
export interface StopMessageRequest {
  session_id: string;
  assistant_message_id: string;
}
```

对应接口：

- `POST /api/message/stop`

前端用途：

- 用户在流式输出时点击新任务入口
- 用户点击“停止生成”

前端处理原则：

- 优先调用 stop 接口
- 本地同步把消息更新为 `interrupted`
- 继续等待 SSE 的 `status` 或 `error/done` 收口事件

#### 8.3.4 History 详情接口对齐要求

文件：`src/api/history.ts`

前端需要与后端对齐以下恢复能力：

- 恢复用户文本消息
- 恢复用户图片消息
- 恢复 assistant 文本消息
- 恢复 assistant 卡片消息
- 若服务端已记录，返回 `task_type`
- 若服务端已记录，返回附件尺寸和 URL 信息

#### 8.3.5 App 配置接口扩展

文件：`src/api/app.ts`

建议在 `AppConfig` 扩展：

```ts
interface AppConfig {
  disclaimer: {
    top_bar: string;
    bottom_hint: string;
  };
  tools: Array<
    ToolItem & {
      trigger_mode?: "pick_image" | "send_message" | "deeplink" | "route";
      preset_text?: string;
    }
  >;
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
```

前端消费原则：

- 快捷入口行为优先由 `trigger_mode` 驱动
- `doctor_reco` 优先读 `preset_text`
- `open_app` 使用 `app_link`

---

## 9. 页面级实现细节

### 9.1 `ChatPage.tsx`

二期仍然以 `ChatPage` 为核心控制器。

#### 9.1.1 当前职责

- 拉 app 配置
- 创建会话
- 加载历史
- 发送文本
- 处理 SSE

#### 9.1.2 二期新增职责

- 统一处理快捷入口点击
- 打开图片选择器
- 发起图片上传
- 发起视觉任务消息
- 管理并发冲突
- 处理中断当前输出
- 处理打开 App 的策略分发
- 消费 `app/config` 中的 `trigger_mode` 和 `preset_text`

#### 9.1.3 建议拆分的函数

```ts
const handleToolClick = async (key: TaskEntryKey) => {}
const handleTextSend = async (text: string) => {}
const handleVisionEntry = async (taskType: TaskType) => {}
const handleImageSelected = async (
  taskType: TaskType,
  files: File[],
) => {}
const startVisionTask = async (
  taskType: TaskType,
  uploads: UploadImageResponse[],
) => {}
const stopCurrentTask = async () => {}
const openAppWithFallback = async () => {}
```

#### 9.1.4 `ChatPage` 内部状态建议

- `historyVisible`
- `imagePickerVisible`
- `pendingVisionTaskType`
- `conflictDialogState`
- `streamMapRef`
- `uploadAbortMapRef`

说明：

- SSE 用 ref 管理是合理的，继续保留
- 上传取消也要用 ref 或 map 管理，避免重渲染丢失

### 9.2 `OpenAppPage.tsx`

职责：

- 展示 App 下载引导
- 提供：
  - 打开 App
  - 去应用商店
  - 复制下载链接

---

## 10. 组件级实现细节

本节直接按“已有组件如何改”和“新增组件做什么”来写。

### 10.1 `BottomToolsBar.tsx`

#### 当前问题

- 只有基础渲染
- 缺少 key 级别的类型约束
- 不区分普通工具和强任务入口

#### 改造目标

- 增加 `TaskEntryKey` 类型约束
- 保持配置驱动
- 保持横向滚动
- 保持历史入口兼容

#### 建议接口

```ts
interface ToolItem {
  key: TaskEntryKey;
  title: string;
  icon: string;
}
```

#### 点击映射规范

- `doctor_reco` -> 按 `preset_text` 直接发普通文本消息，默认 `帮我找医生`
- `report_interpret` -> 打开图片选择器
- `body_part` -> 打开图片选择器
- `ingredient` -> 打开图片选择器
- `drug` -> 打开图片选择器
- `open_app` -> 唤起 App
- `history` -> 打开历史抽屉

### 10.2 `Composer.tsx`

#### 当前问题

- 图片按钮只是 UI
- 文本发送和任务发送没有统一调度
- `isGenerating` 时直接 toast，不支持中断策略

#### 改造目标

- 右侧图片按钮接入图片选择
- 暴露 `onPickImage`
- 暴露 `onInterrupt`
- 结合运行态决定按钮行为

#### 建议接口

```ts
interface ComposerProps {
  limits?: AppConfig["limits"];
  disabled?: boolean;
  isGenerating?: boolean;
  onSend?: (text: string) => void;
  onPickImage?: () => void;
  onInterrupt?: () => void;
}
```

#### 发送按钮行为

- `idle + 有内容`：发送
- `ai_streaming`：显示停止按钮或二次确认
- `uploading_image`：禁用

### 10.3 `ChatMessageList.tsx`

#### 当前问题

- 只识别 `text/card`
- 没有单独处理 `image/status`
- 没有处理中断、折叠、思考状态

#### 改造目标

- 支持 `image`、`status`
- 支持长文本折叠
- 支持状态 badge
- 支持上传态气泡

#### 渲染分发建议

- `user + text` -> `UserMessageBubble`
- `user + image` -> `UploadPreviewBubble`
- `assistant + text` -> `AssistantMessageCard`
- `assistant + status` -> `AssistantStatusMessage`
- `assistant + card` -> 卡片分发

### 10.4 `AssistantMessageCard.tsx`

#### 当前问题

- 只负责 markdown/rich 内容
- 没有“深度思考中”“已完成思考”“已停止生成”
- 没有长文本折叠区

#### 改造目标

- 顶部显示 `MessageStatusBadge`
- 中间显示 `FoldableSection`
- 底部仍复用 `CardFooter`

#### 组件内部结构建议

```text
AssistantMessageCard
  MessageStatusBadge
  FoldableSection
    MarkdownRenderer | BlockRenderer
  CardFooter
```

### 10.5 `IntakeFormCard.tsx`

#### 当前优点

- 提交后直接调用 `onSend`
- 已支持单选、多选和补充文本

#### 二期建议

- 增加 `submitting` 态
- 支持重复点击保护
- 支持提交后展示“已提交”
- 支持和 `task_type` 打通，便于埋点

### 10.6 `DownloadAppCard.tsx`

#### 二期建议

- 与 `OpenAppUpsellCard` 职责分离
- `DownloadAppCard` 保留下载卡
- `OpenAppUpsellCard` 用于报告解读后的“上传更多资料”强转化场景

### 10.7 新增 `ImagePickerSheet.tsx`

职责：

- 展示“拍照 / 从相册选择 / 取消”
- 对外只抛出动作，不做上传

建议接口：

```ts
interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickAlbum: () => void;
}
```

### 10.8 新增 `UploadPreviewBubble.tsx`

职责：

- 展示用户图片消息
- 展示上传中、失败、成功三种态
- 失败时提供重试/删除

建议 props：

```ts
interface UploadPreviewBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
  onRemove?: (messageId: string) => void;
}
```

### 10.9 新增 `MessageStatusBadge.tsx`

职责：

- 统一渲染：
  - `深度思考中`
  - `已完成思考`
  - `已停止生成`
  - `正在分析 1 张图片`

建议不要把这类文案散落在 `AssistantMessageCard` 内部。

### 10.10 新增 `FoldableSection.tsx`

职责：

- 控制长文本折叠/展开
- 展开状态纯本地 UI 状态
- 不回写服务端

### 10.11 新增 `OpenAppUpsellCard.tsx`

职责：

- 展示“打开 APP 上传更多资料”
- 展示病历/报告/处方三个 tab 示例
- CTA 统一调用 `openAppWithFallback`

---

## 11. 快捷入口详细实现

### 11.1 入口枚举

- `report_interpret`
- `open_app`
- `body_part`
- `ingredient`
- `drug`
- `doctor_reco`
- `history`

说明：

- `doctor_reco` 仅作为快捷入口配置 key 使用，不代表独立任务域、独立页面或独立接口。
- 快捷入口具体行为以后端下发的 `trigger_mode` 为准，前端不要把触发方式硬编码在页面逻辑里。

### 11.2 入口行为映射表

| key | 行为 | 是否进入消息流 |
| --- | --- | --- |
| `doctor_reco` | 直接发送普通文本，默认 `帮我找医生` | 是 |
| `report_interpret` | 打开图片选择器，上传后发起视觉任务 | 是 |
| `body_part` | 打开图片选择器，上传后发起视觉任务 | 是 |
| `ingredient` | 打开图片选择器，上传后发起视觉任务 | 是 |
| `drug` | 打开图片选择器，上传后发起视觉任务 | 是 |
| `open_app` | 尝试 deep link，失败跳 `/open-app` | 否 |
| `history` | 打开 `HistoryDrawer` | 否 |

### 11.3 入口埋点建议

至少记录：

- `entry_key`
- `session_id`
- `task_type`
- `from_page=chat`
- `runtime_status_before_click`

---

## 12. 图片任务统一链路

### 12.1 适用任务

- 报告解读
- 拍患处
- 拍成分
- 拍药品

### 12.2 统一执行步骤

1. 用户点击入口
2. 若当前有进行中任务，先执行并发策略
3. 打开图片选择器
4. 用户选择图片
5. 立即插入本地图片消息
6. 开始上传
7. 上传成功后更新消息
8. 组装 `task_context.images + attachment_ids`
9. 调用 `sendMessage`
10. 接收 SSE 输出
11. done 后插入 card 或补充消息

### 12.3 为什么先插入本地消息

- 用户立即获得反馈
- 上传失败时有明确的局部恢复点
- UI 与 IM 体验一致

### 12.4 多图规则

- 本期支持单图为主
- 代码层面按多图设计
- `limits.image_max_count` 默认建议为 9
- 文案按 `X 张图片` 动态展示

---

## 13. 状态机与并发规则

### 13.1 会话运行态

```ts
type TaskRuntimeStatus =
  | "idle"
  | "sending_user_message"
  | "uploading_image"
  | "vision_analyzing"
  | "ai_streaming"
  | "ai_waiting_card"
  | "error";
```

### 13.2 并发优先级

1. 用户点击快捷入口
2. 用户手动发送文本
3. AI 自动追问卡提交

### 13.3 核心规则

#### 13.3.1 AI 正在输出时用户点击快捷入口

推荐策略：

- 先调用 `POST /api/message/stop`
- 中断当前流式消息
- 将当前 assistant message 标记为 `interrupted`
- 新任务立即开始

原因：

- 与“强任务入口优先”一致
- 用户不会困在旧回答里
- 实现复杂度可控

#### 13.3.2 图片上传中再次点击入口

推荐策略：

- 弹确认：
  - 继续新任务
  - 取消
- 用户确认继续时：
  - 调用 `AbortController.abort()`
  - 删除或标记原上传消息为失败/取消

#### 13.3.3 `intake_form` 未提交时用户继续发消息

- 允许
- 不强制清除卡片
- 卡片保留在流内

#### 13.3.4 切换历史会话

- 关闭当前会话流
- 清理当前会话 pending task
- 加载目标会话消息

---

## 14. SSE 与消息落库策略

### 14.1 当前逻辑可复用部分

- `delta` 时首次插入 assistant 消息
- 后续追加 `content`
- `done` 时回写最终内容和 card

### 14.2 二期增强建议

#### `status`

- 用于处理后端新增的 SSE `status` 事件
- 典型文案：
  - `正在分析1张图片`
  - `深度思考中`
  - `已完成思考`
  - `已停止生成`
- 默认作为前端本地 `assistant + type=status` 消息处理，不要求落库

#### `delta`

- 如果首段事件包含思考态，可回写 `thinking_status = "thinking"`

#### `done`

- 回写：
  - `status = sent`
  - `thinking_status = "done"`
  - `content_rich`
  - `attachments`
  - `card`

#### `error`

- 如果已有 assistant 消息：
  - `status = failed`
- 如果是被主动中断：
  - `status = interrupted`
- 关闭 stream 并清理 `generatingBySession`

### 14.3 建议增加的事件兼容

如果后端未来支持，可兼容：

- `thinking_start`
- `thinking_done`
- `card_start`
- `card_done`

前端不要强依赖，按有则用、无则降级。

---

## 15. 上传链路实现细节

### 15.1 图片校验规则

- 类型：`image/jpeg` `image/png` `image/webp`
- 单张大小：默认 10MB
- 超限处理：
  - 先尝试压缩
  - 压缩后仍超限则提示失败

### 15.2 本地处理建议

文件：`src/utils/image.ts`

建议方法：

```ts
export const validateImageFile = async (file: File, maxMb: number) => {}
export const compressImageIfNeeded = async (file: File, maxMb: number) => {}
export const createPreviewUrl = (file: File) => URL.createObjectURL(file)
```

### 15.3 上传消息生成规范

插入的用户图片消息：

```ts
{
  message_id: localId,
  session_id,
  role: "user",
  type: "image",
  content: "",
  attachments: [
    {
      attachment_id: localId,
      type: "image",
      url: previewUrl,
      meta: {
        local_preview_url: previewUrl,
        upload_progress: 0,
        size: file.size
      }
    }
  ],
  created_at,
  status: "sending",
  task_type
}
```

### 15.4 上传成功后回写

- `status: sent`
- `attachment_id: 服务端 file_id`
- `url: 服务端 CDN url`
- `meta.upload_progress = 100`

### 15.5 上传失败后回写

- `status: failed`
- `error_message`
- UI 展示“重试/删除”

---

## 16. 打开 App 技术方案

### 16.1 deep link 工具

文件：`src/utils/deepLink.ts`

建议暴露：

```ts
export interface OpenAppOptions {
  schemeUrl: string;
  fallbackUrl?: string;
  timeoutMs?: number;
}

export const openAppWithFallback = async (
  options: OpenAppOptions,
) => {}
```

### 16.2 平台识别

文件：`src/utils/platform.ts`

建议暴露：

```ts
export const isIOS = () => boolean
export const isAndroid = () => boolean
export const isWechat = () => boolean
export const isDouyinWebView = () => boolean
```

### 16.3 行为规范

- 必须由用户点击触发
- 先尝试唤起
- 超时未切后台则视为失败
- 失败后跳 `/open-app`

### 16.4 `/open-app` 页面内容

- 下载说明
- 应用商店按钮
- 复制链接按钮
- “在浏览器打开后再试”提示

---

## 17. 就医推荐实现口径

### 17.1 本期策略

就医推荐不作为独立业务域实现，直接复用普通问答链路。

### 17.2 前端实现口径

- 点击工具条后直接发送普通用户消息：
  - `content = "帮我找医生"`
- 后续渲染、流式输出、卡片插入、追问提交，全部走现有 `sendMessage + SSE + ChatMessageList` 主链路

### 17.3 明确不做的内容

- 不新增医生专属 card 类型
- 不新增医生列表页
- 不新增医生详情页
- 不新增医生相关 API
- 不为“就医推荐”增加单独路由

---

## 18. 历史记录与二期关系

### 18.1 现有 `HistoryDrawer` 可保留

优点：

- 交互已经完整
- 与当前 chat 路由兼容

### 18.2 二期建议小改

- Banner 的“立即下载”接入真实打开 App 行为
- 删除后如果当前正在任务中，要同步清理 task state
- 未来如记录过多，再升级为独立页面

---

## 19. 错误处理规范

### 19.1 网络错误

继续使用 `src/utils/request.ts` 的统一错误拦截。

### 19.2 任务错误

任务错误不要只 toast，要尽量在消息流中留痕：

- 上传失败：显示在图片气泡中
- 分析超时：显示 assistant 状态消息
- 流式失败：显示 assistant 消息失败态

### 19.3 建议新增业务错误码映射

- 图片过大
- 图片数量超限
- 图片内容无法识别
- Deep Link 失败

---

## 20. UI 细节规范

### 20.1 消息宽度

延续当前 `320px` 主卡宽度，但建议改成响应式：

- `w-[min(320px,calc(100vw-64px))]`

### 20.2 上传态

- 缩略图上覆盖半透明遮罩
- 中间显示：
  - 上传中
  - 72%
  - 上传失败

### 20.3 状态消息

- “正在分析 1 张图片” 不建议做成普通 toast
- 建议做成消息流中的 assistant 状态消息

### 20.4 长文本折叠

- 默认 12 行
- 展开按钮文案：
  - `展开全部`
  - `收起`

---

## 21. 开发计划（已按后端文档对齐）

### 21.1 对齐原则

- 图像链路统一按 `POST /api/upload/image` + `POST /message/send`
- 历史恢复能力统一以 `GET /history/detail` 为准
- 消息中断统一按 `POST /api/message/stop`
- App 唤起配置统一从 `GET /app/config` 获取
- 就医推荐只作为普通文本入口，不新增医生专属前端建设

### 21.2 Phase 2.1（最小可发布）

目标：

- 快捷入口全接通
- 图像上传 + 报告解读主链路可用
- 就医推荐入口可触发普通问答
- 打开 App 唤起与兜底页可用

前端任务：

1. 扩展 `src/types/chat.ts`
2. 新增 `src/types/task.ts`
3. 新增 `src/types/upload.ts`
4. 扩展 `src/store/useChatStore.ts`
5. 新增 `src/store/useTaskStore.ts`
6. 扩展 `src/api/message.ts`，支持 `task_context + attachment_ids`
7. 在 `src/api/message.ts` 新增 `stopMessage`
8. 新增 `src/api/upload.ts`，对接 `POST /api/upload/image`
9. 扩展 `src/api/app.ts`，消费 `trigger_mode/preset_text/app_link`
10. 改 `src/components/BottomToolsBar.tsx`，接通入口行为
11. 新增 `ImagePickerSheet`
12. 新增 `UploadPreviewBubble`
13. 改 `src/pages/ChatPage.tsx`，实现上传后发起分析
14. 改 `src/components/chat/ChatMessageList.tsx`，支持 `image/status`
15. 新增 `src/pages/OpenAppPage.tsx`

验收标准：

- `doctor_reco` 点击后发送普通文本消息
- 图像任务具备上传中、上传成功、上传失败基本链路
- 图像任务发送时带上 `task_context.images + attachment_ids`
- 上传成功后可复用现有 SSE 主链路返回分析结果
- `open_app` 具备唤起和兜底

### 21.3 Phase 2.2（体验增强）

目标：

- 思考状态可视化
- 长文本可折叠
- 中断和并发体验稳定
- 历史回放完整恢复图片与卡片

前端任务：

1. 新增 `MessageStatusBadge`
2. 新增 `FoldableSection`
3. 改 `AssistantMessageCard`
4. 在 `ChatPage` 接入 `/api/message/stop`、中断当前流和并发冲突策略
5. 接入 `history/detail` 的图片与任务标识恢复
6. 优化上传取消、重试、失败提示

验收标准：

- assistant 消息可表达 `thinking/done/interrupted`
- 流式输出中点新任务不会打乱状态
- 历史详情回放图片和卡片无缺失

### 21.4 Phase 2.3（运营与转化）

目标：

- 提升 App 转化
- 补齐埋点与策略化触达

前端任务：

1. 新增 `OpenAppUpsellCard`
2. 补齐快捷入口、上传、发送、卡片、打开 App 埋点
3. 对 App 引导卡和入口增加策略控制位
4. 视后端支持情况补齐 AB 配置消费

验收标准：

- 报告解读后的 App 引导卡可按策略出现
- 主链路埋点完整
- 不影响上传和问答主链路稳定性

### 21.5 建议执行顺序

1. 扩展 `src/types/chat.ts`
2. 新增 `src/types/task.ts`
3. 新增 `src/types/upload.ts`
4. 扩展 `src/api/message.ts`
5. 新增 `stopMessage`
6. 新增 `src/api/upload.ts`
7. 扩展 `useChatStore`
8. 新增 `useTaskStore`
9. 实现 `ImagePickerSheet`
10. 实现 `UploadPreviewBubble`
11. `Composer` 接入图片选择
12. `BottomToolsBar` 接入 `trigger_mode/preset_text`
13. `ChatPage` 实现上传 -> 发消息 -> SSE
14. `ChatPage` 接入 `message/stop`
15. `ChatMessageList` 接入 `image/status`
16. 打开 App 接入 deep link 与兜底页
17. `MessageStatusBadge`
18. `FoldableSection`
19. 并发冲突弹层
20. 上传取消与重试
21. `OpenAppUpsellCard`
22. 埋点补齐

---

## 22. 测试清单

### 22.1 单元测试建议

- `utils/image.ts`
  - 校验
  - 压缩
- `utils/deepLink.ts`
  - 超时兜底
- `useTaskStore`
  - 状态切换
- `useChatStore`
  - 中断消息更新

### 22.2 组件测试建议

- `UploadPreviewBubble`
  - 上传中
  - 失败
  - 重试
- `IntakeFormCard`
  - 单选
  - 多选
  - 提交禁用态
- `FoldableSection`
  - 折叠
  - 展开

### 22.3 联调测试清单

- 新建会话后立即点“就医推荐”
- AI 正在输出时点“报告解读”
- 上传失败后重试
- 历史会话切换时中断旧流
- 微信环境打开 App 失败兜底
- 图片无法识别时返回模板提示

---

## 23. 具体到文件的改造清单

### 必改文件

- `src/pages/ChatPage.tsx`
- `src/components/BottomToolsBar.tsx`
- `src/components/Composer.tsx`
- `src/components/chat/ChatMessageList.tsx`
- `src/components/chat/cards/AssistantMessageCard.tsx`
- `src/store/useChatStore.ts`
- `src/types/chat.ts`
- `src/api/message.ts`
- `src/api/app.ts`
- `src/router/index.tsx`

### 新增文件

- `src/store/useTaskStore.ts`
- `src/api/upload.ts`
- `src/types/task.ts`
- `src/types/upload.ts`
- `src/utils/image.ts`
- `src/utils/deepLink.ts`
- `src/utils/platform.ts`
- `src/components/uploader/ImagePickerSheet.tsx`
- `src/components/uploader/UploadPreviewBubble.tsx`
- `src/components/chat/base/MessageStatusBadge.tsx`
- `src/components/chat/base/FoldableSection.tsx`
- `src/components/chat/cards/OpenAppUpsellCard.tsx`
- `src/pages/OpenAppPage.tsx`

---

## 24. 不建议本期做的事情

- 不建议现在就把所有任务都拆成独立页面
- 不建议把所有状态都塞进 `ChatPage` 本地 `useState`
- 不建议为了图片上传临时新造一套消息列表

---

## 25. 结论

二期前端的核心不是“多加几个按钮”，而是把当前已成型的一期聊天框架升级为“任务化对话容器”。现有代码已经具备三项关键基础：会话化路由、SSE 消息流、卡片消息渲染。二期真正需要补的是四层能力：

1. 类型层：补齐任务、上传、状态、消息扩展字段。
2. 调度层：在 `ChatPage` 外围建立统一入口与并发规则。
3. 视图层：补齐图片消息、状态消息、折叠态、App 引导卡。
4. 承接层：补齐打开 App 兜底页，并保证图片任务和问答主链路衔接稳定。

只要按本文档的类型和模块边界推进，后续开发就不会在“入口怎么发、消息怎么存、状态怎么切、失败怎么恢复”这些关键问题上反复返工。
