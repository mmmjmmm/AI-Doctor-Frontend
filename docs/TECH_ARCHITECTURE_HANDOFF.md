# AI-Doctor-Frontend 研发交接技术架构文档

## Summary

本文基于当前代码仓库的真实实现，对前端应用的技术架构、模块职责、接口协议、关键状态机、主要时序、边界 case、未闭环能力和交接注意事项进行完整说明。  
适用对象是接手该项目的前端、后端联调、测试和技术负责人。  
结论上，这个项目已经具备“会话化 AI 医疗咨询 H5”的核心链路，但当前仍是“单控制器编排架构”，核心业务高度集中在 `ChatPage`，若继续扩展能力，建议逐步拆分任务调度层和消息交互层。

## 1. 系统定位与目标

### 1.1 产品定位

当前应用是一个移动端优先的 AI 医疗咨询 H5，主要运行于：

- 浏览器
- WebView
- 可能的微信/抖音内嵌环境

### 1.2 当前产品能力范围

前端已支持：

- 自动创建咨询会话
- 查看历史会话
- 按会话回放消息
- 发送文本消息
- 接收 SSE 流式回复
- 发起图片类咨询任务
- 渲染结构化问诊卡片
- 渲染下载引导卡片
- 渲染咨询总结卡片
- 打开 App / 下载 App 的兜底页

### 1.3 当前产品边界

前端当前未完整闭环：

- 输入区语音能力
- 输入区直接选图能力
- 消息复制/重生成/点赞/点踩/分享
- 下载卡片 CTA 行为
- 历史列表分页
- 真正意义的“全量清空历史”
- 上传真实进度显示
- 任务级 UI 状态透出
- App deep link 失败自动兜底策略

## 2. 技术栈与基础设施

### 2.1 技术栈

- 构建：Vite 5
- 框架：React 18
- 语言：TypeScript
- 路由：React Router 6
- 服务端状态：TanStack Query
- 本地业务状态：Zustand + Immer
- 请求层：Axios
- UI：Tailwind CSS + antd-mobile
- 富文本：markdown-it + DOMPurify
- 流式协议：SSE EventSource

### 2.2 应用启动入口

入口链路如下：

1. `src/main.tsx`
2. `src/App.tsx`
3. `RouterProvider`
4. `AppShell`
5. 页面组件

关键文件：

- `src/main.tsx`
- `src/App.tsx`
- `src/router/index.tsx`
- `src/layouts/AppShell.tsx`

### 2.3 QueryClient 配置

全局 QueryClient 配置如下：

- query 失败重试 1 次
- 切回窗口时不自动 refetch

这意味着项目更偏移动端对话体验，而非强实时数据后台。

## 3. 路由架构

### 3.1 路由定义

当前路由只有 3 个有效入口：

- `/chat`
- `/chat/:sessionId`
- `/open-app`

### 3.2 路由职责

`/chat`

- 默认聊天页
- 无会话时自动建会话
- 承载普通文本问答
- 承载快捷工具触发后的任务执行
- 承载历史回放后的会话详情展示

`/chat/:sessionId`

- 指向具体历史会话
- 通过 `sessionId` 拉取历史详情并注入 store

`/open-app`

- App 打开与下载的兜底承接页

### 3.3 路由设计特点

当前没有把“聊天”和“任务页”拆分成独立页面。  
所有能力都复用 `ChatPage`，这简化了路由复杂度，但把业务控制权集中到了一个页面中。

## 4. 分层架构

### 4.1 当前分层

仓库结构可抽象为：

- `pages/`
  - 页面编排与副作用控制
- `components/`
  - UI 渲染与局部交互
- `api/`
  - 接口定义与响应类型
- `store/`
  - 本地业务状态
- `types/`
  - 统一业务模型
- `utils/`
  - 请求封装与通用工具

### 4.2 实际控制中心

虽然目录分层清晰，但实际控制中心高度集中在 `src/pages/ChatPage.tsx`。

`ChatPage` 当前承担：

- App 配置拉取
- 会话初始化
- 历史会话加载
- activeSession 同步
- SSE 生命周期管理
- 文本消息发送
- 停止生成
- 图片上传任务
- 快捷工具点击路由
- 页面级状态协调

这意味着它本质上是“页面 + controller + task orchestrator”的混合体。

## 5. 核心数据模型

### 5.1 Message 模型

核心消息模型定义于 `src/types/chat.ts`。

重要字段如下：

- `message_id`
- `session_id`
- `role`
- `type`
- `content`
- `content_rich`
- `attachments`
- `status`
- `feedback_status`
- `card`
- `task_type`
- `thinking_status`
- `fold_meta`
- `action_meta`
- `client_only`
- `error_message`

### 5.2 Message 的业务含义

`role`

- `user`
- `assistant`
- `system`

`type`

- `text`
- `image`
- `card`
- `status`

`status`

- `sending`
- `sent`
- `failed`
- `deleted`
- `interrupted`

### 5.3 Card 模型

当前支持 3 种结构化卡片：

- `intake_form`
- `download_app`
- `consult_summary`

这些卡片通过 `Message.card` 挂载，而不是使用独立消息模型。

### 5.4 TaskType 模型

当前任务类型有：

- `chat`
- `report_interpret`
- `body_part`
- `ingredient`
- `drug`

注意：

- `doctor_reco` 当前未进入 `TaskType`
- 医生推荐目前仍按普通文本问答处理，而非专门任务类型

### 5.5 Task Store 模型

定义于 `src/types/task.ts`。

已设计但未完全用起来的概念包括：

- `TaskRuntimeStatus`
- `PendingTask`
- `TaskContext`

当前实际落地最多的是 `TaskRuntimeStatus`，主要用于记录：

- `idle`
- `sending_user_message`
- `uploading_image`
- `vision_analyzing`
- `ai_streaming`
- `ai_waiting_card`
- `error`

## 6. Store 架构

### 6.1 useAppStore

文件：

- `src/store/useAppStore.ts`

职责：

- 存储服务端下发的 app config
- 给顶栏免责声明、工具栏、输入限制、open-app 页提供配置来源

状态结构简单：

- `config`
- `setConfig`

### 6.2 useChatStore

文件：

- `src/store/useChatStore.ts`

职责：

- 保存当前激活会话 ID
- 按会话保存消息列表
- 按会话保存是否生成中
- 按会话保存当前流式 assistant message ID

核心状态：

- `activeSessionId`
- `messagesBySession`
- `generatingBySession`
- `streamingMessageIdBySession`

核心行为：

- `setActiveSessionId`
- `setMessages`
- `addMessage`
- `updateMessage`
- `removeMessage`
- `clearMessages`
- `setSessionGenerating`
- `setStreamingMessageId`
- `interruptAssistantMessage`

### 6.3 useTaskStore

文件：

- `src/store/useTaskStore.ts`

职责定位：

- 保存任务运行态
- 预留 pendingTask 能力

当前真实使用情况：

- `runtimeStatusBySession` 有在 `ChatPage` 中持续更新
- `pendingTaskBySession` 基本未被消费

因此目前它更像“半完成状态机容器”。

## 7. API 架构与协议

### 7.1 请求层统一封装

文件：

- `src/utils/request.ts`

统一协议约定：

```ts
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

成功判定：

- `code === 0`

失败处理：

- 业务错误码映射 Toast
- HTTP 错误映射 Toast
- 最终 reject Promise

### 7.2 已接入接口

#### App 配置

- `GET /app/config`

文件：

- `src/api/app.ts`

用途：

- 免责声明
- 工具栏配置
- 输入限制
- App scheme / 下载地址

#### 会话

- `POST /session/create`
- `POST /session/end`

文件：

- `src/api/session.ts`

#### 历史

- `GET /history/list`
- `GET /history/detail`
- `POST /history/delete`
- `POST /history/batch_delete`

文件：

- `src/api/history.ts`

#### 消息

- `POST /message/send`
- `POST /message/stop`

文件：

- `src/api/message.ts`

#### 上传

- `POST /upload/image`

文件：

- `src/api/upload.ts`

### 7.3 sendMessage 协议

请求结构：

- `session_id`
- `client_message_id`
- `content`
- `task_context`
- `attachment_ids`

响应结构：

- `user_message_id`
- `user_message`
- `assistant_message_id`
- `stream.protocol`
- `stream.stream_url`

这说明消息发送采用“两段式响应”：

1. 先返回发送结果和流地址
2. 再通过 SSE 补全 assistant 输出

## 8. 页面与组件职责

### 8.1 ChatPage

文件：

- `src/pages/ChatPage.tsx`

这是当前项目最关键的文件。

#### 主要职责

- 拉取 app config
- 依据 URL `sessionId` 拉取历史详情
- 自动建会话
- 同步 `activeSessionId`
- 管理所有 EventSource
- 发送消息
- 停止消息
- 处理图片上传
- 处理工具点击
- 渲染主聊天页布局

#### 当前问题

- 业务逻辑过重
- 任务逻辑和消息逻辑耦合
- 页面卸载、切会话、SSE 清理逻辑都集中于此
- 后续如再加入医生推荐、图片重试、消息反馈，会继续膨胀

### 8.2 HistoryDrawer

文件：

- `src/components/HistoryDrawer.tsx`

职责：

- 按可见状态加载历史列表
- 支持选择进入会话
- 支持编辑模式
- 支持批量删除
- 支持当前已加载列表清空

边界：

- 只拉近 30 天
- 没有分页
- “清空全部”只是清空当前已加载的数据，不是服务端全量语义

### 8.3 Composer

文件：

- `src/components/Composer.tsx`

职责：

- 文本输入
- 聚焦展开
- 自适应高度
- 发送按钮

当前真实可用能力：

- 只支持发送文本

当前展示但未闭环能力：

- 语音按钮
- 图片按钮
- “结合历史对话”按钮

### 8.4 BottomToolsBar

文件：

- `src/components/BottomToolsBar.tsx`

职责：

- 根据后端配置渲染工具项
- 将点击事件交给页面调度

这是一个完全配置驱动的入口层。

### 8.5 ChatMessageList

文件：

- `src/components/chat/ChatMessageList.tsx`

职责：

- 渲染完整消息列表
- 对 assistant 连续消息分组
- 自动滚动到底部
- 分发不同 card 类型
- 在生成中显示 loading bubble

特点：

- user message 逐条渲染
- assistant message 连续分组，只显示一次头像
- 对空消息进行过滤

### 8.6 AssistantMessageCard

文件：

- `src/components/chat/cards/AssistantMessageCard.tsx`

职责：

- 渲染 assistant 文本
- `content_rich` 优先走 BlockRenderer
- 否则走 MarkdownRenderer
- 底部挂载 CardFooter

问题：

- copy / regenerate / like / dislike / share 只有 `console.log`

### 8.7 IntakeFormCard

文件：

- `src/components/chat/cards/IntakeFormCard.tsx`

职责：

- 单选 / 多选
- 自由补充
- 提交后组装消息文本并回发 `onSend`

特点：

- `submitted` 后不允许再次提交
- 文案组装规则固定为：
  - 标题
  - 选择
  - 补充

### 8.8 DownloadAppCard

文件：

- `src/components/chat/cards/DownloadAppCard.tsx`

职责：

- 展示下载类卡片 UI

问题：

- CTA 事件未闭环
- 当前点击只会 `console.log`

### 8.9 ConsultSummaryCard

文件：

- `src/components/chat/cards/ConsultSummaryCard.tsx`

职责：

- 展示咨询总结
- 展示患者信息
- 展示建议列表
- 局部折叠展开

问题：

- like / dislike / share 仍未闭环

## 9. 关键业务流程时序

### 9.1 启动到可聊天时序

1. 用户进入 `/`
2. 路由重定向到 `/chat`
3. `ChatPage` 挂载
4. 请求 `/app/config`
5. 若无 `sessionId` 且无 `activeSessionId`
6. 自动调用 `/session/create`
7. 后端返回 `session + welcome_messages`
8. 写入 `useChatStore`
9. 跳转到 `/chat/:sessionId`
10. 页面进入可用状态

### 9.2 历史会话回放时序

1. 用户从历史抽屉点击某个 session
2. 跳转到 `/chat/:sessionId`
3. `ChatPage` 监听到 `sessionId` 变化
4. `setActiveSessionId(sessionId)`
5. Query 调用 `/history/detail`
6. 返回该会话全部消息
7. `setMessages(sessionId, historyData.messages)`
8. `ChatMessageList` 直接按现有协议渲染

### 9.3 文本发送时序

1. 用户在 `Composer` 输入文本并点击发送
2. `ChatPage.handleSend` 执行
3. 本地先插入一条 `user/text/sending`
4. 设置 runtime status 为 `sending_user_message`
5. 设置当前会话生成中
6. 调用 `/message/send`
7. 成功后：
   - 本地 user message 改为 `sent`
   - 创建 `EventSource`
   - 设置 streaming message id
8. SSE `delta`
   - 首次 delta 插入 assistant 草稿消息
   - 后续 delta 追加内容
9. SSE `done`
   - 用 final 覆盖草稿内容
   - 追加 card messages
10. 关闭流
11. 重置生成状态和 runtime status

### 9.4 停止生成时序

1. 当前会话存在 `streamingMessageId`
2. 用户触发停止逻辑
3. 调用 `/message/stop`
4. 无论 stop 成功或失败，都本地 close EventSource
5. store 中把 assistant 消息标成 `interrupted`
6. 清理 generating 和 runtime status

### 9.5 图片任务时序

1. 用户点击工具栏图片类入口
2. `ChatPage` 记录 `pendingImageTool`
3. 触发隐藏 file input
4. 用户选择 1~N 张图片
5. 遍历文件列表
6. 每张图先插入本地 `user/image/sending`
7. 逐张调用 `/upload/image`
8. 上传成功后更新该图片消息 URL 和状态
9. 上传失败则标记该图片消息为 `failed`
10. 若至少 1 张成功
11. 调用 `handleSend(defaultPrompt, { attachment_ids, task_context })`
12. 后续进入普通 SSE 回复链路

### 9.6 工具栏调度时序

根据 `tool.trigger_mode` 或 `tool.key` 决定行为：

- `route` -> 打开历史抽屉
- `deeplink` -> 跳 `/open-app`
- `send_message` -> 直接发预设文案
- `pick_image` -> 打开选图
- fallback legacy key -> 做兼容映射

## 10. 状态机说明

### 10.1 会话级生成状态

实际会话级“是否生成中”来自 `useChatStore.generatingBySession`。

作用：

- 控制是否显示 loading bubble
- 阻止用户在 `Composer` 中继续发送
- 处理工具栏触发前的中断逻辑

### 10.2 任务运行状态

来自 `useTaskStore.runtimeStatusBySession`。

当前被设置的状态包括：

- `sending_user_message`
- `uploading_image`
- `vision_analyzing`
- `ai_streaming`
- `error`
- `idle`

### 10.3 当前状态机的问题

虽然 runtime status 被设置得比较完整，但 UI 对这些状态几乎没有消费。  
当前只有少量状态通过普通 status message 或 loading bubble 间接表现。  
因此现在的状态机更像“内部记录”，不是完整的可观察 UI 状态机。

## 11. 边界 Case 清单

### 11.1 已处理的边界

- 无会话自动建会话
- 新会话建成后避免立即重复拉详情
- 切换会话时清理旧 SSE
- stop 失败时仍允许本地中断
- 图片任务允许部分图片上传成功后继续分析
- `done` 返回空内容时避免生成空消息
- 删除当前激活历史会话时清空 store 并回退到 `/chat`

### 11.2 未完全处理的边界

- `URL.createObjectURL` 未释放
- 上传未限制图片体积和数量
- 上传未做格式兜底校验
- 上传无真实进度
- 上传失败无重试按钮
- 多图上传串行，弱网场景耗时长
- 切会话时 runtime status 清理依赖页面 effect，耦合较强
- input 区按钮视觉存在但功能不存在
- 消息操作区视觉存在但功能不存在
- 历史“清空全部”语义与用户理解可能不一致
- deep link 只有显式点击，没有自动尝试失败回退
- `pendingTaskBySession` 存在但不参与真实流程

### 11.3 潜在回归点

后续开发最容易破坏的点：

- `activeSessionId` 与 URL 不一致
- SSE 未及时 close 导致串流残留
- 历史详情覆盖本地新会话消息
- `skipLocalUserMessage` 路径下本地图片消息替换异常
- assistant `done` 覆盖草稿时丢失 card 或 metadata
- 删除当前会话后页面状态悬空

## 12. 公共接口与类型变更注意事项

### 12.1 当前对后端的隐式依赖

实现里对后端存在较强假设：

- `/message/send` 一定返回 `assistant_message_id`
- `stream.stream_url` 可直接被 `EventSource` 消费
- SSE 事件类型固定为 `status / delta / done / error`
- `done.final` 和 `done.cards` 结构固定
- `history/detail.messages` 可直接按前端 `Message` 类型渲染
- `app/config.tools` 可驱动整个工具栏

### 12.2 后端字段变更高风险区

以下字段一旦变化，前端会直接出现功能异常：

- `AppTool.key`
- `AppTool.trigger_mode`
- `SendMessageResponse.stream.stream_url`
- `done.final.message_id`
- `done.cards[].card.card_type`
- `upload/image` 返回的 `file_id` 和 `url`

### 12.3 前端内部接口稳定性

对仓库内其他模块而言，当前最重要的内部接口是：

- `useChatStore` 的消息读写 API
- `ChatPage.handleSend` 的调用语义
- `Message` 类型协议
- `AppConfig.tools` 的驱动协议

如果后续重构，建议优先保持这几处兼容。

## 13. 测试建议与验收场景

### 13.1 基础验收场景

1. 进入 `/chat` 自动建会话成功
2. 欢迎消息可展示
3. 普通文本提问可流式返回
4. 历史抽屉能打开并进入旧会话
5. 删除当前会话后页面恢复到可建新会话状态
6. 工具栏 `doctor_reco` 能直接发预设消息
7. 图片任务上传成功后能进入分析链路
8. `/open-app` 页面能在无配置时正确兜底 toast

### 13.2 关键异常场景

1. `/session/create` 失败
2. `/message/send` 失败
3. SSE 建连失败
4. SSE 中途 `error`
5. `done.final` 为空
6. 全部图片上传失败
7. 部分图片上传失败
8. 删除当前正在查看的历史会话
9. 快速切换多个历史会话
10. 正在生成时点击其他工具入口

### 13.3 UI 验收场景

1. assistant 连续消息只显示一次头像
2. markdown 列表、标题、链接样式正常
3. intake form 提交后不可重复提交
4. consult summary 折叠展开正常
5. loading bubble 仅在合理时机显示
6. 移动端宽度下布局不溢出

## 14. 当前架构风险与后续演进建议

### 14.1 当前主要风险

- 单文件控制中心过重
- UI 占位功能较多，容易误判为已完成
- 任务状态机存在但未对 UI 形成闭环
- 请求层与 UI Toast 强耦合
- 历史、任务、消息的职责边界还不够硬

### 14.2 推荐的下一步重构方向

1. 将 `ChatPage` 拆成 3 层

- page layout
- session controller
- task/message orchestrator

2. 抽离 `useChatController`

- 会话初始化
- 消息发送
- SSE 管理
- 停止生成

3. 抽离 `useImageTask`

- 选图
- 上传
- 失败处理
- 生成 task_context

4. 抽离消息操作能力

- copy
- feedback
- regenerate
- share

5. 让 `runtimeStatusBySession` 真正驱动 UI

- 上传中
- 分析中
- 生成中
- 错误态
- 已中断

6. 修正历史清空语义

- 明确“当前页清空”还是“全量清空”

## 15. Assumptions And Defaults

### 15.1 当前文档中的默认判断

- 以仓库当前代码为准，不以 `docs/` 中规划性描述为准
- 将已经存在 UI 但未接行为的能力判定为“未完成”
- 将 `useTaskStore.pendingTaskBySession` 判定为“预留设计，未落地”
- 将 `doctor_reco` 判定为“普通文本快捷任务”，而非专门任务类型
- 将 `/open-app` 判定为“显式兜底页”，而不是自动 deep link 调度器

### 15.2 当前构建状态

- `pnpm build` 通过
- `pnpm lint` 通过，但有 1 条无害 warning

### 15.3 交接默认建议

- 新功能尽量不要继续堆到 `ChatPage`
- 所有新消息类型优先复用现有 `Message` 模型
- 所有任务入口优先走配置驱动
- 所有后端联调先确保 `Message` 协议稳定再扩功能

## 16. Public APIs / Interfaces / Types

### Public APIs

- `GET /api/app/config`
- `POST /api/session/create`
- `POST /api/session/end`
- `GET /api/history/list`
- `GET /api/history/detail`
- `POST /api/history/delete`
- `POST /api/history/batch_delete`
- `POST /api/message/send`
- `POST /api/message/stop`
- `POST /api/upload/image`

### Important Internal Interfaces

- `Message`
- `Session`
- `TaskContext`
- `AppConfig`
- `AppTool`
- `useChatStore` actions
- `useTaskStore` actions

## 17. Implementation Hand-off Notes

如果由下一位工程师接手，建议按以下顺序理解和改造：

1. 先读 `src/pages/ChatPage.tsx`
2. 再读 `src/store/useChatStore.ts`
3. 再读 `src/types/chat.ts`
4. 再看 `src/components/chat/ChatMessageList.tsx`
5. 最后看 `api/` 目录理解前后端协议

第一阶段最适合做的工程化动作是：

- 抽离 `ChatPage` 中的发送与 SSE 逻辑
- 把下载卡和消息操作栏接成真正可用
- 把输入区的“假按钮”清理或接通
- 把图片任务限制、进度、重试补齐
