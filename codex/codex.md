## openRouter配置

1.  key:"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"
2.  .codex/config.toml

```bash
model = "gpt-5-codex"

# 不写 model_provider，或者保持你当前 OpenAI 默认

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"
wire_api = "responses"

[profiles.openrouter]
model = "google/gemini-2.5-flash"
model_provider = "openrouter"

```

3. 要用OpenRouter时

```bash
codex --profile openrouter
```

### provider / profile / model 三者关系图

Codex
├─ provider（提供商 / 通道）
│ ├─ openai
│ └─ openrouter
│
├─ profile（配置方案 / 一键切换包）
│ ├─ default
│ └─ openrouter
│
└─ model（具体模型）
├─ gpt-5-codex
├─ google/gemini-2.5-flash
└─ anthropic/claude-3.7-sonnet
