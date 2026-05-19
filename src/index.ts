export type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content?: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export interface Tool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export interface LLMResponse {
  text: string
  toolCalls: ToolCall[]
  stopReason: 'end' | 'tool_use' | 'max_tokens'
}

export interface LLMUsageEvent {
  tokens:     { input: number; output: number }
  modelId:    string
  stopReason: LLMResponse['stopReason']
}

export interface LLM {
  invoke(messages: Message[], options?: { tools?: Tool[] }): Promise<LLMResponse>
}
