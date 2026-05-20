# @noetaris/harness-types

Shared LLM type contract for the [@noetaris/harness](../core) ecosystem.

This package defines the common TypeScript interfaces that all LLM adapter packages implement. The core harness never imports these types — they are an ecosystem convention that lets adapters be structurally interchangeable.

## Overview

`@noetaris/harness-types` is a types-only package with zero runtime code and zero dependencies. It provides the canonical definitions for messages, tools, and the `LLM` interface — the surface that all adapters (Anthropic, OpenAI, Gemini, etc.) must satisfy.

## Types

| Type | Description |
|------|-------------|
| `Message` | Discriminated union: `{ role: 'user'; content: string }` \| `{ role: 'assistant'; content?: string; toolCalls?: ToolCall[] }` \| `{ role: 'tool'; toolCallId: string; content: string }` |
| `Tool` | `{ name: string; description: string; inputSchema: Record<string, unknown> }` |
| `ToolCall` | `{ id: string; name: string; input: unknown }` |
| `LLMResponse` | `{ text: string; toolCalls: ToolCall[]; stopReason: 'end' \| 'tool_use' \| 'max_tokens' }` |
| `LLMUsageEvent` | `{ tokens: { input: number; output: number }; modelId: string; stopReason: LLMResponse['stopReason'] }` |
| `LLM` | `{ invoke(messages: Message[], options?: { tools?: Tool[] }): Promise<LLMResponse> }` |

## Installation

```sh
pnpm add @noetaris/harness-types
```

Requires Node.js ≥ 22.

## Usage

```ts
import type { LLM, Message, LLMResponse, Tool } from '@noetaris/harness-types'

class MyAdapter implements LLM {
  async invoke(messages: Message[], options?: { tools?: Tool[] }): Promise<LLMResponse> {
    // ...
  }
}
```

## Related Packages

- [`@noetaris/harness`](https://github.com/noetaris-lab/harness) — core execution engine
- [`@noetaris/harness-anthropic`](https://github.com/noetaris-lab/harness-anthropic) — Anthropic Claude adapter
- [`@noetaris/harness-openai`](https://github.com/noetaris-lab/harness-openai) — OpenAI adapter
- [`@noetaris/harness-google`](https://github.com/noetaris-lab/harness-google) — Google Gemini adapter

## License

MIT
