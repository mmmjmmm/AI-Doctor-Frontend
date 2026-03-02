# AI-Doctor-Frontend Code Review (严格版)

## 1) 项目功能理解

该仓库是一个基于 `React + TypeScript + Vite` 的移动端风格 AI 问诊前端，核心链路：

1. 进入 `/chat` 自动创建会话。  
2. 用户发送消息。  
3. 后端返回 `assistant_message_id + stream_url`，前端通过 `EventSource` 实时接收流式增量。  
4. 流结束后将最终文本与卡片消息（问诊单、下载引导、总结卡片）落地到本地消息状态。  
5. 用户可打开历史抽屉查看并删除历史会话。  

## 2) 架构与实现质量评估

### 优点

- **职责分层较清晰**：`api/` 负责接口，`store/` 负责全局状态，`pages/ChatPage.tsx` 做编排。  
- **消息渲染扩展性可接受**：`ChatMessageList` 对 assistant 文本与多卡片类型分流渲染。  
- **Markdown 安全意识较好**：`MarkdownIt + DOMPurify` 的组合可降低 XSS 风险。  
- **错误体验基础具备**：请求层与业务错误码有统一 Toast 提示。  

### 主要问题（按严重级别）

#### P0（阻断级）

1. **`Composer` 中使用 `Toast` 但未导入，导致 TypeScript 构建失败。**  
   - 影响：`pnpm build` 无法通过，属于发布阻断。  
   - 建议：补充 `import { Toast } from 'antd-mobile'`。  

#### P1（高优先级）

2. **流式状态 `isGenerating` 设计为全局布尔值，缺少“按会话/按消息粒度”隔离。**  
   - 影响：未来若支持并发请求（或切会话时残留流），可能出现错误 loading 状态。  
   - 建议：改为 `generatingBySessionId` 或 `generatingMessageIds`。  

3. **`ChatPage` 存在刻意规避 hooks 依赖的写法（eslint disable），有状态漂移风险。**  
   - 影响：某些边界下可能出现 session 初始化与 store 真实状态不一致。  
   - 建议：重构自动建会话 effect，拆分触发条件，避免 suppress lint。  

4. **历史页删除后未同步当前激活会话状态。**  
   - 影响：如果删除的是当前会话，主聊天区仍可能显示已失效数据，URL/store 状态不一致。  
   - 建议：删除成功后检测 `activeSessionId` 是否在删除列表中，必要时跳转并重建会话。  

#### P2（中优先级）

5. **请求层把 UI 行为（Toast）直接内嵌在 `request.ts`，耦合较重。**  
   - 影响：复用到非 UI 场景（SSR、脚本、测试）不方便。  
   - 建议：将错误转换与提示解耦，拦截器仅抛业务错误对象，在调用层决定展示方式。  

6. **`MessageActionsBar` 及若干卡片交互仍为 `console.log` 占位。**  
   - 影响：用户可见按钮但无实际行为，体验与可维护性都受影响。  
   - 建议：最少实现复制、点赞/点踩本地态与接口占位。  

7. **样式中存在较多硬编码宽高与文案，国际化/响应式扩展成本高。**  
   - 影响：跨端适配与产品迭代成本增加。  
   - 建议：抽离 UI tokens 与文案常量。  

## 3) 本次已落实修复

- 已修复 `Composer` 缺失 `Toast` 导入导致的构建失败问题。  

## 4) 建议优先级路线

1. 先完成 P0/P1：保证构建与会话状态一致性。  
2. 再处理 P2：降低耦合、补齐交互闭环。  
3. 最后做体验类治理：设计 token、i18n、可测试性增强。  

