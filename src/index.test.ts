import { describe, it, expectTypeOf } from 'vitest'
import type { Message, Tool, ToolCall, LLMResponse, LLM } from './index.js'

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
