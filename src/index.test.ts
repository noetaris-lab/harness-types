import { describe, it, expectTypeOf, expect } from 'vitest'
import type { Message, Tool, ToolCall, LLMResponse, LLM, ToolCallEvent, ToolResultEvent, LLMRequestEvent, LLMUsageEvent } from './index.js'

describe('Message discriminated union', () => {

  it('user variant excludes toolCallId and toolCalls after narrowing', () => {
    const msg: Message = { role: 'user', content: 'hello' }
    if (msg.role === 'user') {
      // @ts-expect-error — toolCallId must not leak onto user variant
      void msg.toolCallId
      // @ts-expect-error — toolCalls must not leak onto user variant
      void msg.toolCalls
    }
  })

  it('assistant variant excludes toolCallId after narrowing', () => {
    const msg: Message = { role: 'assistant', toolCalls: [{ id: 'tc-1', name: 'search', input: {} }] }
    if (msg.role === 'assistant') {
      // @ts-expect-error — toolCallId must not leak onto assistant variant
      void msg.toolCallId
    }
  })

  it('tool variant requires toolCallId and excludes toolCalls after narrowing', () => {
    const msg: Message = { role: 'tool', toolCallId: 'tc-1', content: 'result' }
    if (msg.role === 'tool') {
      // @ts-expect-error — toolCalls must not leak onto tool variant
      void msg.toolCalls
    }
    // @ts-expect-error — toolCallId is required on tool variant
    const _missing: Message = { role: 'tool', content: 'result' }
    void _missing
  })

})

describe('Tool', () => {

  it('has no invoke method', () => {
    expectTypeOf<Tool>().not.toHaveProperty('invoke')
  })

})

describe('ToolCall', () => {

  it('types input as unknown, not any', () => {
    const call: ToolCall = { id: 'tc-1', name: 'lookup', input: { key: 'value' } }
    expectTypeOf(call.input).toEqualTypeOf<unknown>()
  })

  it('all fields are required', () => {
    // @ts-expect-error — id is required
    const _noId: ToolCall = { name: 'lookup', input: null }
    void _noId
    // @ts-expect-error — name is required
    const _noName: ToolCall = { id: 'tc-1', input: null }
    void _noName
  })

})

describe('LLMResponse', () => {

  it('rejects stopReason values outside the defined union', () => {
    // @ts-expect-error — "stop" is not a valid stopReason
    const _bad1: LLMResponse = { text: '', toolCalls: [], stopReason: 'stop' }
    void _bad1
    // @ts-expect-error — "length" is not a valid stopReason
    const _bad2: LLMResponse = { text: '', toolCalls: [], stopReason: 'length' }
    void _bad2
  })

  it('toolCalls is required and cannot be omitted', () => {
    // @ts-expect-error — toolCalls is required, not optional
    const _bad: LLMResponse = { text: 'hello', stopReason: 'end' }
    void _bad
  })

})

describe('LLM', () => {

  it('a plain object with matching invoke signature satisfies LLM without class inheritance', () => {
    const adapter = {
      invoke: async (_messages: Message[], _options?: { tools?: Tool[] }): Promise<LLMResponse> => ({
        text: 'response',
        toolCalls: [],
        stopReason: 'end',
      })
    }
    expectTypeOf(adapter).toExtend<LLM>()
  })

})

describe('ToolCallEvent and ToolResultEvent', () => {

  describe('ToolResultEvent optional field presence', () => {

    it('result and error are absent when not provided on ToolResultEvent', () => {
      // arrange
      const event: ToolResultEvent = {
        toolName: 'search',
        toolCallId: 'tc-abc',
        durationMs: 42,
      }

      // act / assert
      expect(event.result).toBeUndefined()
      expect(event.error).toBeUndefined()
    })

    it('input is absent when not provided on ToolCallEvent', () => {
      // arrange
      const event: ToolCallEvent = {
        toolName: 'search',
        toolCallId: 'tc-abc',
      }

      // act / assert
      expect(event.input).toBeUndefined()
    })

    it('result and error can coexist on a single ToolResultEvent', () => {
      // arrange
      const event: ToolResultEvent = {
        toolName: 'search',
        toolCallId: 'tc-abc',
        durationMs: 100,
        result: { hits: 3 },
        error: new Error('partial failure'),
      }

      // act / assert
      expect(event.result).toEqual({ hits: 3 })
      expect(event.error).toBeInstanceOf(Error)
    })

  })

  describe('toolCallId correlation', () => {

    it('toolCallId is equal on a matching ToolCallEvent and ToolResultEvent pair', () => {
      // arrange
      const callEvent: ToolCallEvent = {
        toolName: 'read_file',
        toolCallId: 'tc-xyz-999',
        input: { path: '/tmp/data.txt' },
      }
      const resultEvent: ToolResultEvent = {
        toolName: 'read_file',
        toolCallId: 'tc-xyz-999',
        durationMs: 87,
        result: 'file contents here',
      }

      // act / assert
      expect(callEvent.toolCallId).toBe(resultEvent.toolCallId)
      expect(callEvent.toolCallId).toBe('tc-xyz-999')
    })

  })

})

describe('LLMRequestEvent optional field presence', () => {

  it('returns undefined for messages and tools when constructed with only required fields', () => {
    // arrange
    const event: LLMRequestEvent = { modelId: 'gpt-4o', providerName: 'openai' }

    // act
    const messages = event.messages
    const tools = event.tools

    // assert
    expect(messages).toBeUndefined()
    expect(tools).toBeUndefined()
  })

  it('carries exact values for all four fields when constructed with messages and tools', () => {
    // arrange
    const msgs = [{ role: 'user', content: 'hello' }]
    const tools = [{ name: 'search', description: 'web search', inputSchema: {} }]
    const event: LLMRequestEvent = { modelId: 'claude-3-opus', providerName: 'anthropic', messages: msgs, tools: tools }

    // act
    const modelId = event.modelId
    const providerName = event.providerName
    const eventMessages = event.messages
    const eventTools = event.tools

    // assert
    expect(modelId).toBe('claude-3-opus')
    expect(providerName).toBe('anthropic')
    expect(eventMessages).toBe(msgs)
    expect(eventTools).toBe(tools)
  })

})

describe('LLMUsageEvent backward-compatible output field', () => {

  it('output is undefined when LLMUsageEvent is constructed without it', () => {
    // arrange
    const event: LLMUsageEvent = { tokens: { input: 10, output: 5 }, modelId: 'gemini-1.5-pro', stopReason: 'end', providerName: 'google' }

    // act
    const output = event.output

    // assert
    expect(output).toBeUndefined()
  })

  it('output holds the exact supplied value when included in LLMUsageEvent', () => {
    // arrange
    const response = { text: 'hello', toolCalls: [], stopReason: 'end' }
    const event: LLMUsageEvent = { tokens: { input: 8, output: 12 }, modelId: 'llama3', stopReason: 'end', providerName: 'ollama', output: response }

    // act
    const output = event.output

    // assert
    expect(output).toBe(response)
  })

})
