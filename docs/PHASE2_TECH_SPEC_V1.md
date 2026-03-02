# AI 医生问答 H5（二期）技术细节文档

- 产品名称：AI 医生问答 H5（能力增强版）
- 文档版本：V1.0
- 目标发布形态：H5（微信 / 抖音 / 浏览器 WebView）
- 编写依据：一期现有前端实现 + 二期 PRD

---

## 1. 一期现状与可复用能力盘点

### 1.1 已具备能力（可直接复用）

1. **多会话 + 路由框架已完成**
   - 路由已支持 `/chat` 与 `/chat/:sessionId`，具备会话化对话基础。 
2. **流式对话链路已可用**
   - `sendMessage` 返回 `stream_url`，前端通过 `EventSource` 处理 `delta/done/error`。 
3. **消息体系已具备文本 + 卡片混排能力**
   - `Message.type` 支持 `text/card`，并在 `ChatMessageList` 内按卡片类型分发渲染。
4. **历史会话基础能力已具备**
   - 已支持历史列表查询、详情回放、批量删除。
5. **底部工具条已存在，可扩展快捷任务入口**
   - 当前 `BottomToolsBar` 已根据配置渲染工具项并处理点击。
6. **Markdown 渲染 + 安全清洗已具备**
   - `MarkdownIt + DOMPurify` 已接入。

### 1.2 一期到二期的关键差距

1. **图片链路缺失**：目前发送链路仅文本，无图片选择 / 上传 / 进度 / 失败重试。
2. **快捷任务仍为占位行为**：除历史入口外，工具条点击多为“功能建设中”。
3. **医生推荐尚无页面承接**：无 `/doctor/list`、`/doctor/detail/:id`。
4. **打开 App 策略未统一**：缺少 Deep Link 尝试 + 下载页兜底。
5. **并发状态机未标准化**：虽已做会话级生成态，但未完整覆盖“上传中/分析中/中断”等状态。

---

## 2. 二期总体技术方案

### 2.1 分层原则（延续一期）

- `api/`：仅负责请求定义与返回类型
- `store/`：会话级消息状态 + 任务状态机
- `pages/`：路由页编排与副作用控制
- `components/`：消息渲染、卡片、上传态、任务入口
- `utils/`：平台探测、deep link、上传压缩、并发控制器

### 2.2 二期架构主线

二期以“**任务化入口驱动对话**”为主线：

1. 用户点击快捷入口（报告解读/就医推荐/拍患处/拍成分/拍药品/打开APP/咨询记录）
2. 前端构造标准化任务请求（文本任务或图像任务）
3. 进入统一状态机（上传、分析、流式、中断、失败）
4. 消息区按统一 `Message` 协议渲染文本、图片、卡片与状态
5. 在策略命中时注入 App 引导卡，并支持跳转承接页

---

## 3. 目录与模块改造清单

### 3.1 新增 / 改造文件建议

```text
src/
  api/
    vision.ts                # 图片上传、视觉分析任务接口
    doctor.ts                # 医生推荐、医生详情、列表
    appLink.ts               # App 唤起/下载配置接口（可选）
  components/
    chat/
      cards/
        OpenAppUpsellCard.tsx
        DoctorRecoFallbackCard.tsx      # 若后端失败或无数据
      base/
        MessageStatusBadge.tsx          # 深度思考中/已完成思考
    uploader/
      ImagePickerSheet.tsx              # 相册/拍照入口
      UploadPreviewBubble.tsx           # 上传中/失败/重试
  pages/
    DoctorListPage.tsx
    DoctorDetailPage.tsx
    RecordsPage.tsx                     # 若与 HistoryDrawer 分页化分离
    OpenAppPage.tsx
  store/
    useTaskStore.ts                     # 二期新增任务状态机（推荐）
  utils/
    deepLink.ts
    image.ts                            # 压缩/格式校验
    platform.ts
```

### 3.2 路由扩展

在现有路由基础上新增：

- `/doctor/list`
- `/doctor/detail/:id`
- `/records`
- `/open-app`

其中 `/records/:sessionId` 可复用现有 `/chat/:sessionId`，不强制新增独立页面。

---

## 4. 数据模型与协议设计

### 4.1 前端消息模型扩展（建议）

在 `Message` 基础上扩展但保持向后兼容：

```ts
interface Message {
  // 现有字段保留
  type: 'text' | 'image' | 'card';
  status: 'sending' | 'sent' | 'failed' | 'deleted' | 'interrupted';

  // 二期建议新增
  task_type?: 'chat' | 'doctor_reco' | 'report_interpret' | 'body_part' | 'ingredient' | 'drug';
  thinking_status?: 'thinking' | 'done';
  foldable?: {
    enabled: boolean;
    collapsed: boolean;
    collapsed_lines?: number;
  };
}
```

> 注：就医推荐本期按你的要求可先用基础文本输出，不强制新增 `doctor_reco_list` card 类型；若后续要强结构化，可再增量扩展。

### 4.2 任务请求协议（前后端约定）

统一 `task_context`：

```json
{
  "task_type": "report_interpret",
  "entry": "quick_tool",
  "images": [{"file_id": "xxx", "url": "..."}],
  "extra": {
    "city": "杭州",
    "department": ["内科"]
  }
}
```

文本任务（如就医推荐）走 `message/send` 即可；图像任务建议分两步：

1. 上传：`POST /vision/upload` -> `file_id`
2. 发消息：`POST /message/send`（附 `task_context.images`）

---

## 5. 核心流程实现细节

## 5.1 快捷入口条（重点）

### 5.1.1 配置驱动

沿用 `app/config.tools`，新增约定 key：

- `report_interpret`
- `open_app`
- `body_part`
- `ingredient`
- `drug`
- `doctor_reco`
- `history`

### 5.1.2 点击映射

- `doctor_reco`：直接发送用户消息“帮我找医生”
- `report_interpret/body_part/ingredient/drug`：打开图片选择器
- `open_app`：执行唤起逻辑
- `history`：打开历史抽屉（复用现有）

---

## 5.2 就医推荐任务流

### 5.2.1 首版（本期建议）

- 点击入口后立即插入用户消息：`帮我找医生`
- 走现有流式回复链路
- AI 若返回 intake_form 卡，则按现有 `IntakeFormCard` 渲染提交

### 5.2.2 增强版（可选）

- 新增 `/doctor/list` 与 `/doctor/detail/:id` 承接“查看全部/查看详情”
- 当后端回传推荐结构时，映射成卡片或文本中的可点击 action

### 5.2.3 异常策略

- 无推荐数据：插入兜底文案 + 可选 intake_form
- 接口失败：展示可重试消息按钮（在 message action 区）

---

## 5.3 报告解读任务流

### 5.3.1 入口到上传

1. 打开 `ImagePickerSheet`（相册/拍照）
2. 选择后先本地插入 `image` 消息（`status=sending`）
3. 异步上传，进度映射到气泡 UI
4. 成功后更新为 `status=sent` + 真实 URL

### 5.3.2 分析与流式输出

- 上传成功后自动发送带 `task_context.report_interpret` 的消息
- AI 第一条状态消息：`正在分析X张图片`
- 正文流式输出（Markdown）
- 支持 `thinking_status`：
  - `thinking` -> 展示“深度思考中”
  - `done` -> 展示“已完成思考”

### 5.3.3 折叠/展开

- 默认折叠 12~16 行
- 本地 UI 状态控制，不影响消息原文
- 折叠态仍可点赞/复制/分享

### 5.3.4 追问与 App 引导

- AI 决定是否返回 intake_form，前端“有则渲染，无则跳过”
- 命中策略时插入 `DownloadAppCard/OpenAppUpsellCard`

---

## 5.4 拍患处 / 拍成分 / 拍药品

三者与“报告解读”共用一条图像任务链路，仅 `task_type` 与提示词模板不同：

- `body_part`
- `ingredient`
- `drug`

技术上通过同一上传组件、同一发送方法、同一状态机处理。

---

## 5.5 打开 App

### 5.5.1 Deep Link 方案

- 尝试：`xiaohe://upload?from=h5_ai_doctor`
- 失败兜底：跳 `/open-app`，提供“去应用商店/复制链接”

### 5.5.2 平台差异

- 微信 / 抖音 WebView：强依赖用户手势触发
- iOS：若唤起失败给明确说明，不重复强跳

---

## 6. 状态机与并发规则（前端实现口径）

### 6.1 状态定义

- `idle`
- `sending_user_message`
- `ai_streaming`
- `ai_waiting_card`
- `uploading_image`
- `vision_analyzing`
- `error`

### 6.2 优先级

1. 快捷入口新任务
2. 手动文本发送
3. AI 自动追问卡

### 6.3 强制规则

1. **Streaming 中点击新任务**：默认“新任务优先”，中断当前流并将原消息标记 `interrupted`
2. **上传中再次触发图像任务**：弹确认；继续则取消当前上传并清理占位
3. **intake_form 未提交时发送新消息**：允许，卡片保留

### 6.4 落地建议

- `useTaskStore` 维护全局任务指针：`currentTaskId/currentTaskType/currentState`
- `ChatPage` 只做编排，不直接散落并发判断

---

## 7. 接口设计建议（前后端对齐）

### 7.1 新增接口

1. `POST /vision/upload`
   - 入参：文件二进制 / formData
   - 出参：`file_id`, `url`, `width`, `height`

2. `GET /doctor/list`
   - 入参：`city`, `department`, `page`, `page_size`

3. `GET /doctor/detail`
   - 入参：`doctor_id`

4. `GET /app/deeplink-config`（可选）
   - 下发平台化唤起与下载地址

### 7.2 复用接口

- `POST /message/send`
  - 增加 `task_context`（可选）
- `GET /history/detail`
  - 支持恢复图片消息与任务类型

---

## 8. UI 组件细节规范

### 8.1 UploadPreviewBubble

- 状态：`uploading/success/failed`
- 交互：失败时 `重试/删除`
- 限制：单图 10MB，多图最多 9 张（超限即拦截提示）

### 8.2 MessageStatusBadge

- `thinking`：深度思考中（转圈）
- `done`：已完成思考（静态）

### 8.3 OpenAppUpsellCard

- 按钮：`打开APP 上传更多资料`
- Tab：病历/报告/处方
- 文案区：分析治疗方案 / 解答常见问题

---

## 9. 风险与兜底

## 9.1 技术风险

1. WebView 相机/相册权限差异大
2. 图片上传链路耗时不稳定
3. 并发任务导致状态错乱

## 9.2 兜底策略

1. 所有耗时步骤必须可取消、可重试
2. 统一错误码映射与 Toast（沿用现有 request 层）
3. AI 超时插入“稍后重试”系统消息，不阻塞输入区

---

## 10. 迭代计划（建议）

### Phase 2.1（最小可发布）

- 快捷入口全接通
- 图像上传 + 报告解读主链路
- 就医推荐入口触发 + 文本回答
- 打开 App 唤起与兜底页

### Phase 2.2（体验增强）

- 医生列表/详情页
- 思考状态徽标 + 文本折叠优化
- 上传队列与中断体验优化

### Phase 2.3（运营与转化）

- App 引导策略 AB
- 推荐卡样式增强与埋点归因

---

## 11. 验收清单（前端视角）

1. 快捷入口点击后均有明确任务动作，无“功能建设中”死路。
2. 图像任务具备上传中、成功、失败、重试完整链路。
3. AI 流式过程中可中断并开启新任务，消息标记正确。
4. 历史会话恢复后可正确回放文本、卡片、图片。
5. WebView 环境下打开 App 失败有下载兜底，不阻断用户主路径。

