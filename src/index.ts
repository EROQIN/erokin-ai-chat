import { Context, Dict, Schema, h } from "koishi";
import { OpenAIClient } from "./utils/AIRequest";

export const name = "erokin-ai-chat";

export interface Config {
  baseURL: string;
  apiKey: string;
  defaultModel: string;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
  splitOutput?: boolean; // 新增配置字段
  delimiter?: string; // 分割符，默认是\n
  charInterval?: number; // 单个字符间隔时间，默认是200ms
  personalities?: Dict<string>; // 新增预设人格字段
}

export const Config: Schema<Config> = Schema.object({
  baseURL: Schema.string()
    .description("兼容OpenAI类型的接口地址")
    .default("https://api.openai.com"),
  apiKey: Schema.string().description("API密钥"),
  defaultModel: Schema.string().description("模型名称"),
  max_tokens: Schema.number().description("单次token消耗上限").default(2048),
  temperature: Schema.number()
    .description(
      "一般不用修改，值越大文本的创造力随机性越大，请保证温度参数在0.0~1.5之间以确保模型能正常输出"
    )
    .default(0.7),
  systemPrompt: Schema.string()
    .description(`系统提示词`)
    .default("you are a helpful assistant"),
  splitOutput: Schema.boolean() // 新增配置字段
    .description("是否启用分割输出内容(建议配合系统提示词使用splitOutput、delimiter和charInterval设置)")
    .default(true), // 默认开启分割输出
  delimiter: Schema.string() // 分割符，默认是\n
    .description("分割输出时使用的分隔符(为了防止转义，请点编辑json后填写)")
    .default("\n"),
  charInterval: Schema.number() // 单个字符间隔时间，默认是200ms
    .description("分割输出时模拟bot打字时间的单个字符间隔时间（ms）")
    .default(200),

  personalities: Schema.dict(String)
    .role("table")
    .description("人格名(key)：人格提示词(value) ")
    .default({ "AI助手" : `you are a helpful assistant` }), // 添加默认人格
});

export function apply(ctx: Context, config: Config) {
  // 创建请求
  const openai = new OpenAIClient({
    baseURL: `${config.baseURL}`,
    apiKey: `${config.apiKey}`,
    defaultModel: `${config.defaultModel}`,
    temperature: config.temperature,
    max_tokens: config.max_tokens,
  });

  let validId: number;
  let currentPersonality: string | undefined; // 当前选择的预设人格

  ctx
    .command(
      "chat <prompt:text>",
      `和AI聊天，当前AI模型:${openai.config.defaultModel}\n提示：建议配合系统提示词使用splitOutput、delimiter和charInterval设置`
    )
    .action(async ({ session }, prompt) => {
      if (!chatHistory) {
        initChatHistory();
      }
      if (prompt == "clear") {
        initChatHistory();
        console.log("========对话记录已清空!========");
        return "对话记录已清空!";
      }
      chatHistory.push({ role: "user", content: prompt });
      const response = await chatRequest(chatHistory);
      console.log("==========================================================");
      
      chatHistory.push({ role: "assistant", content: response });
      // 删除response中的<think></think>标签及其中间的内容
      let res = response.replace(/<think>.*?<\/think>/gs, "");

      try {
        validId = session.id;
        if (config.splitOutput) {
          await sendSplitOutput(
            session,
            res,
            validId,
            config.delimiter,
            config.charInterval
          );
        } else {
          session.send(res);
        }
      } catch (error) {
        console.error("Error:", error.message);
        return error.message;
      }
    });

  // 调用方法
  async function chatRequest(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>
  ) {
    try {
      const response = await openai.createChatCompletion(messages);
      console.log("AI Response:", response);
      return response; // 确保返回的是实际的响应内容
    } catch (error) {
      console.error("Error:", error.message);
      return "<think></think>" + error.message;
    }
  }

  // 发送分割输出
  async function sendSplitOutput(
    session,
    res,
    validId,
    delimiter,
    charInterval
  ) {
    let resArr = res.split(delimiter);
    let first = true;
    for (let i = 0; i < resArr.length && validId == session.id; i++) {
      if (resArr[i]) {
        if (first) {
          session.send(`${resArr[i]}`);
          first = false;
          continue;
        }
        if (session.id == validId) {
          await new Promise((resolve) =>
            setTimeout(resolve, resArr[i].length * charInterval)
          );
          if (session.id == validId) session.send(`${resArr[i]}`);
        }
      }
    }
  }

  // 新增 persona 命令
  ctx
    .command("persona", "AI人格设置");


    ctx
      .command('persona.clear',"取消当前设置的人格")
      .action(async ({ session }) => {
        currentPersonality = undefined;
        return "已回到默认人格"
      })


    ctx
      .command('persona.list',"查看预设人格列表")
      .action(async ({ session }) => {
        if (!config.personalities || Object.keys(config.personalities).length == 0) {
          return "没有预设人格";
        }
        const personalities = Object.keys(config.personalities)
          .map((key) => `- ${key}`)
          .join("\n");
        return `可用的预设人格:\n${personalities}`;
      })


    ctx
    .command("persona.set <personality:string>", "设置当前预设人格")
    .action(({ session }, personality) => {
      if (!config.personalities || !config.personalities[personality]) {
        return `预设人格 ${personality} 不存在。`;
      }
      currentPersonality = personality;
      initChatHistory();
      return `已切换到预设人格: ${personality}`;
    })


    ctx
    .command("persona.current ", "查看当前预设人格")
    .action(({ session }) => {
      if (!currentPersonality) {
        return "当前没有选择预设人格";
      }
      return `当前预设人格: ${currentPersonality}`;
    });

  // 新增清空对话记录的函数
  function initChatHistory() {
    chatHistory = [
      {
        role: "system",
        content: `${
          currentPersonality ? config.personalities[currentPersonality] : config.systemPrompt
        }`,
      },
    ];
  }
}

// 用于记录对话历史
let chatHistory: Array<{
  role: "system" | "user" | "assistant";
  content: string;
}>;



