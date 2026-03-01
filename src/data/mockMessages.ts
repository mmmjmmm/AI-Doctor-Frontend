import { type Message, type Session } from "@/types/chat";

const SESSION_ID = "sess_mock_001";

// 1. 欢迎语
const msg_welcome: Message = {
  message_id: "msg_welcome",
  session_id: SESSION_ID,
  role: "assistant",
  type: "text",
  content:
    "你好，我是小荷健康推出的 AI 健康咨询助手，可以为你提供全天 24 小时的健康帮助，快来和我对话吧！",
  created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  status: "sent",
  content_rich: {
    blocks: [
      {
        type: "paragraph",
        text: "你好，我是小荷健康推出的 AI 健康咨询助手，可以为你提供全天 24 小时的健康帮助，快来和我对话吧！",
      },
      {
        type: "list",
        items: ["小肚子胀胀的怎么回事", "便秘怎么快速排便", "最近总是失眠"],
      },
    ],
  },
  disclaimer_bottom: "AI回答仅供参考，请勿用于医疗诊断或就医决策",
};

// 2. 用户提问：失眠
const msg_user_1: Message = {
  message_id: "msg_user_1",
  session_id: SESSION_ID,
  role: "user",
  type: "text",
  content: "我最近总是失眠",
  created_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  status: "sent",
};

// 3. AI 追问（结构化卡片）：时长
const msg_ai_intake_1: Message = {
  message_id: "msg_ai_intake_1",
  session_id: SESSION_ID,
  role: "assistant",
  type: "card",
  content: "您这次失眠大概持续多久了？",
  created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  status: "sent",
  card: {
    card_type: "intake_form",
    title:
      "您这次失眠大概持续多久了？比如是最近几天才出现的，还是已经断断续续好几个星期了？",
    allow_multi: false,
    options: [
      { key: "1-2days", label: "1-2天" },
      { key: "3-4days", label: "3-4天" },
      { key: "1week", label: "一周内" },
      { key: "over1week", label: "超过一周" },
    ],
    free_text: {
      enabled: true,
      placeholder: "补充其他信息",
      max_len: 100,
    },
    submit: {
      action: "send_message",
      button_text: "发送",
    },
  },
};

// 4. 用户回答：一周内
const msg_user_2: Message = {
  message_id: "msg_user_2",
  session_id: SESSION_ID,
  role: "user",
  type: "text",
  content: "一周内",
  created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  status: "sent",
};

// 5. AI 诊断报告（长文本 + Markdown）
const msg_ai_report: Message = {
  message_id: "msg_ai_report",
  session_id: SESSION_ID,
  role: "assistant",
  type: "text",
  content: "...", // 简略内容，主要看 content_rich
  created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  status: "sent",
  content_rich: {
    blocks: [
      { type: "heading", text: "根据咨询信息为你分析：" },
      {
        type: "paragraph",
        text: "失眠（短期）\n依据：失眠持续一周内，近期压力较大。\n判断：可能是压力性失眠。\n严重程度：轻微，暂无需就医，注意调节心态即可。",
      },
      { type: "heading", text: "01 治疗方向" },
      {
        type: "list",
        items: [
          "睡前泡脚，听轻音乐放松",
          "避免睡前看手机、喝咖啡",
          "可以尝试褪黑素（辅助）",
        ],
      },
      { type: "heading", text: "02 用药参考" },
      {
        type: "paragraph",
        text: "如果症状持续加重，建议咨询医生后使用助眠药物。",
      },
    ],
  },
  disclaimer_bottom: "回答不构成诊断依据，如有不适请尽快就医",
  feedback_status: "none",
};

// 6. 下载引导卡片
const msg_download: Message = {
  message_id: "msg_download",
  session_id: SESSION_ID,
  role: "assistant",
  type: "card",
  content: "[下载小荷AI医生]",
  created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  status: "sent",
  card: {
    card_type: "download_app",
    title: "下载APP 选择历史对话接着聊",
    sub_title: "小荷AI医生",
    icon_url:
      "https://p3-health.byteimg.com/tos-cn-i-4949r99sc3/9d4f0d6d0d6d4d6d0d6d4d6d0d6d4d6d.png~tplv-4949r99sc3-png.png", // 替换为真实或占位图
    image_url: "",
    cta: {
      text: "下载APP 选择历史对话",
      action: "download",
    },
  },
};

// 7. 咨询总结卡片
const msg_summary: Message = {
  message_id: "msg_summary",
  session_id: SESSION_ID,
  role: "assistant",
  type: "card",
  content: "[咨询总结]",
  created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  status: "sent",
  card: {
    card_type: "consult_summary",
    hint: "基于你提供信息生成",
    title: "本次咨询总结",
    summary:
      "根据您的描述，初步判断为短期压力性失眠，建议优先进行生活方式调整。",
    patient_info: {
      title: "患者信息与咨询摘要",
      items: [
        { label: "主诉", value: "失眠" },
        { label: "症状", value: "入睡困难，多梦，易醒" },
        { label: "持续时间", value: "一周内" },
        { label: "诱因", value: "近期工作压力大" },
      ],
    },
    advice_list: [
      {
        title: "生活建议",
        content:
          "1. 固定作息时间：每天同一时间上床睡觉和起床。\n2. 营造舒适环境：保持卧室安静、黑暗、温度适宜。\n3. 睡前放松：尝试深呼吸、冥想或听轻音乐。",
      },
      {
        title: "就医提示",
        content: "若症状持续超过3周，或出现头晕、心慌等症状，请及时就医。",
      },
    ],
    footer: {
      disclaimer: "AI建议仅供参考，如有不适请及时就医",
    },
  },
};

export const MOCK_MESSAGES: Message[] = [
  msg_welcome,
  msg_user_1,
  msg_ai_intake_1,
  msg_user_2,
  msg_ai_report,
  msg_download,
  msg_summary,
];

export const MOCK_SESSION: Session = {
  session_id: SESSION_ID,
  status: "active",
  started_at: new Date().toISOString(),
  title: "失眠咨询",
};
