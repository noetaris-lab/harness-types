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
 * Payload emitted by LLM adapters as an `"llm.request"` observer event,
 * immediately before the provider call is made.
 *
 * `messages` and `tools` are opt-in — they may contain sensitive data and are
 * typed as `unknown` because adapters pass their internal translated
 * representations; the framework never inspects this content.
 */
export interface LLMRequestEvent {
  modelId:      string
  providerName: string
  messages?:    unknown   // opt-in; adapter's internal translated representation
  tools?:       unknown   // opt-in; adapter's internal translated representation
}

/**
 * Token-usage payload emitted by LLM adapters as an `llm.response` observer event.
 *
 * Adapters that cannot report real token counts (e.g. mock adapters) emit `{ input: 0, output: 0 }`.
 *
 * `output` is opt-in — it may contain sensitive data; adapters default to omitting it.
 */
export interface LLMUsageEvent {
  tokens:       { input: number; output: number }
  modelId:      string
  stopReason:   LLMResponse['stopReason']
  providerName: string
  output?:      unknown   // opt-in; normalized LLMResponse or raw provider output; may be sensitive
}

/**
 * Payload emitted on `"tool.call"` before a tool is dispatched.
 *
 * `input` is opt-in — it may contain sensitive data; omit by default.
 */
export interface ToolCallEvent {
  toolName:   string
  toolCallId: string
  input?:     unknown
}

/**
 * Payload emitted on `"tool.result"` after a tool completes or throws.
 *
 * `result` and `error` are opt-in — they may contain sensitive data; omit by default.
 * Set `error` when the tool threw; leave it absent on success.
 */
export interface ToolResultEvent {
  toolName:   string
  toolCallId: string
  durationMs: number
  result?:    unknown
  error?:     unknown
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
