/**
 * Shared LLM protocol types used by all harness LLM adapters.
 *
 * @packageDocumentation
 */

/**
 * A single turn in a conversation.
 *
 * - `user` — text input from the human side.
 * - `assistant` — model reply, optionally carrying tool-call requests.
 * - `tool` — result returned to the model after a tool call.
 */
export type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content?: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

/**
 * A tool the LLM may invoke during a conversation turn.
 *
 * `inputSchema` must be a valid JSON Schema object describing the tool's
 * input parameters (LLM adapters pass it to the provider as-is).
 */
export interface Tool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

/**
 * A single tool-call request emitted by the LLM in an assistant turn.
 *
 * `id` is provider-assigned and must be echoed back in the corresponding
 * `role: 'tool'` message so the model can correlate results.
 */
export interface ToolCall {
  id: string
  name: string
  input: unknown
}

/**
 * Normalized response returned by every {@link LLM} adapter.
 *
 * `text` may be empty when `stopReason` is `'tool_use'`.
 * `toolCalls` is empty when `stopReason` is `'end'` or `'max_tokens'`.
 */
export interface LLMResponse {
  text: string
  toolCalls: ToolCall[]
  stopReason: 'end' | 'tool_use' | 'max_tokens'
}

/**
 * Token-usage payload emitted by LLM adapters as an `llm.response` observer event.
 *
 * Adapters that cannot report real token counts (e.g. mock adapters) emit `{ input: 0, output: 0 }`.
 */
export interface LLMUsageEvent {
  tokens:     { input: number; output: number }
  modelId:    string
  stopReason: LLMResponse['stopReason']
}

/**
 * Core interface every LLM adapter must implement.
 *
 * @example
 * ```ts
 * const response = await llm.invoke(messages, { tools: [myTool] })
 * ```
 */
export interface LLM {
  /**
   * Send a message list to the LLM and return a normalized response.
   *
   * @param messages - Conversation history, oldest first.
   * @param options.tools - Optional tools the model may invoke.
   */
  invoke(messages: Message[], options?: { tools?: Tool[] }): Promise<LLMResponse>
}
