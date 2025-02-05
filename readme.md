# erokin-ai-chat

[![npm](https://img.shields.io/npm/v/koishi-plugin-erokin-ai-chat?style=flat-square)](https://www.npmjs.com/package/erokin-ai-chat)


一个基于 Koishi 框架的 AI 聊天插件，支持与 OpenAI 类型的 API 进行交互。该插件提供了丰富的配置选项，包括分割输出内容、自定义分隔符、模拟打字时间间隔以及预设人格等功能。

## 安装

确保你已经安装了 Koishi 并且有一个兼容 OpenAI 类型的 API 密钥。然后你可以通过以下命令安装此插件：

```bash
npm install @your-repo/erokin-ai-chat
```

## 配置

在插件配置中添写以下配置项：

```yaml
plugins:
  erokin-ai-chat:
    baseURL: https://api.openai.com # 兼容OpenAI类型的接口地址
    apiKey: YOUR_API_KEY         # API密钥
    defaultModel: gpt-3.5-turbo  # 模型名称
    max_tokens: 2048             # 单次token消耗上限
    temperature: 0.7             # 温度参数（0.0~1.5）
    systemPrompt: you are a helpful assistant # 系统提示词
    splitOutput: true            # 是否启用分割输出内容
    delimiter: "\n"              # 分割输出时使用的分隔符
    charInterval: 200            # 分割输出时模拟bot打字时间的单个字符间隔时间（ms）
    personalities:               # 预设人格字段
      "AI助手": "you are a helpful assistant"
```

### 配置项说明

- **baseURL**: 兼容 OpenAI 类型的接口地址，默认为 `https://api.openai.com`。
- **apiKey**: API 密钥，必填。
- **defaultModel**: 模型名称，默认为 `gpt-3.5-turbo`。
- **max_tokens**: 单次 token 消耗上限，默认为 `2048`。
- **temperature**: 温度参数，值越大文本的创造力随机性越大，默认为 `0.7`。
- **systemPrompt**: 系统提示词，默认为 `you are a helpful assistant`。
- **splitOutput**: 是否启用分割输出内容，默认为 `true`。建议配合系统提示词使用 `splitOutput`、`delimiter` 和 `charInterval` 设置。
- **delimiter**: 分割输出时使用的分隔符，默认为 `\n`。为了防止转义，请直接编辑 JSON 后填写。
- **charInterval**: 分割输出时模拟 bot 打字时间的单个字符间隔时间（ms），默认为 `200`。
- **personalities**: 预设人格字段，键为人格名，值为人格提示词。默认包含一个名为 `AI助手` 的人格。

## 命令

### chat <prompt:text>

与 AI 聊天。

**示例:**

```plaintext
/chat 你好，世界！
```

#### chat clear

清空上下文历史记录。

### persona

AI 人格设置。

#### persona list

查看预设人格列表。

**示例:**

```plaintext
/persona list
```

#### persona set <personality:string>

设置当前预设人格。

**示例:**

```plaintext
/persona set AI助手
```

#### persona current

查看当前预设人格。

**示例:**

```plaintext
/persona current
```

#### persona clear

取消当前设置的人格，回到默认人格。

**示例:**

```plaintext
/persona clear
```

## 示例配置

以下是一个完整的示例配置：

```yaml
plugins:
  erokin-ai-chat:
    baseURL: https://api.openai.com
    apiKey: YOUR_API_KEY
    defaultModel: gpt-3.5-turbo
    max_tokens: 2048
    temperature: 0.7
    systemPrompt: you are a helpful assistant
    splitOutput: true
    delimiter: "\n"
    charInterval: 200
    personalities:
      "AI助手": "you are a helpful assistant"
      "创意作家": "you are a creative writer"
      "技术专家": "you are a tech expert"
```

## 注意事项

1. **API 密钥安全**: 确保你的 API 密钥不会泄露给他人。
2. **网络连接**: 确保你的服务器能够访问配置的 `baseURL`。
3. **权限管理**: 根据需要限制某些命令的使用权限。
