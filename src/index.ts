import { Context, Schema, h } from "koishi";
import { OpenAIClient } from "./utils/AIRequest";

export const name = "erokin-ai-chat";

export interface Config {
  baseURL: string;
  apiKey: string;
  defaultModel: string;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
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
});

export function apply(ctx: Context, config: Config) {
  //创建请求
  const openai = new OpenAIClient({
    baseURL: `${config.baseURL}`,
    apiKey: `${config.apiKey}`,
    defaultModel: `${config.defaultModel}`,
    temperature: config.temperature,
    max_tokens: config.max_tokens
  });

  let validId: number;

  ctx
    .command(
      "chat <prompt:text>",
      `和AI聊天，当前AI模型:${openai.config.defaultModel}`
    )
    .action(async ({ session }, prompt) => {
      if (!chatHistory) {
        chatHistory = [{ role: "system", content: `${config.systemPrompt}` }];
      }
      if (prompt == "clear") {
        chatHistory = [{ role: "system", content: `${config.systemPrompt}` }];
        console.log("========对话记录已清空!========");
        return "对话记录已清空!";
      }
      chatHistory.push({ role: "user", content: prompt });
      const response = await chatRequest(chatHistory);
      chatHistory.push({ role: "assistant", content: response });
      // //删除response中的<think></think>标签及其中间的内容
      let res = response.replace(/<think>.*?<\/think>/gs, "");
      // //以res中的\n为分界线切割res
      let resArr = res.split("\n");
      console.log(
        "============================================================================="
      );

      try {
        //遍历resArr
        validId = session.id;
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
                setTimeout(resolve, resArr[i].length * 200)
              );
              if (session.id == validId) session.send(`${resArr[i]}`);
            }
          }
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
      return response;
    } catch (error) {
      console.error("Error:", error.message);
      return "<think></think>" + error.message;
    }
  }
}

//用于记录对话历史
let chatHistory: Array<{
  role: "system" | "user" | "assistant";
  content: string;
}>;