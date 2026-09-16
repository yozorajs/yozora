import { expect, test } from 'vitest'
import type { IYozoraUseCaseAnswers } from '../../../script/test/index.mjs'
import { resolveAnswer } from '../../../script/test/index.mjs'

test('inherits each representation independently', () => {
  const answer: IYozoraUseCaseAnswers = {
    gfm: { html: 'gfm html', markup: 'gfm markup', ast: { type: 'gfm' } },
    'gfm-ex': { html: 'gfm-ex html' },
    yozora: { markup: 'yozora markup' },
  }

  expect(resolveAnswer(answer, 'gfm')).toEqual(answer.gfm)
  expect(resolveAnswer(answer, 'gfm-ex')).toEqual({
    html: 'gfm-ex html',
    markup: 'gfm markup',
    ast: { type: 'gfm' },
  })
  expect(resolveAnswer(answer, 'yozora')).toEqual({
    html: 'gfm-ex html',
    markup: 'yozora markup',
    ast: { type: 'gfm' },
  })
})

test('inherits directly from gfm when the intermediate parser has no answer', () => {
  const answer: IYozoraUseCaseAnswers = {
    gfm: { html: 'html', markup: 'markup', ast: { type: 'gfm' } },
    yozora: { ast: { type: 'yozora' } },
  }

  expect(resolveAnswer(answer, 'gfm-ex')).toEqual(answer.gfm)
  expect(resolveAnswer(answer, 'yozora')).toEqual({
    html: 'html',
    markup: 'markup',
    ast: { type: 'yozora' },
  })
})

test('keeps empty strings and empty objects as explicit overrides', () => {
  const answer: IYozoraUseCaseAnswers = {
    gfm: { html: 'html', markup: 'markup', ast: { type: 'gfm' } },
    'gfm-ex': { html: '', ast: {} },
    yozora: { markup: '' },
  }

  expect(resolveAnswer(answer, 'yozora')).toEqual({ html: '', markup: '', ast: {} })
})

test('leaves unavailable representations undefined', () => {
  expect(resolveAnswer({ gfm: { html: '' } }, 'yozora')).toEqual({
    html: '',
    markup: undefined,
    ast: undefined,
  })
})

test('does not materialize inherited fields into the fixture', () => {
  const answer = Object.freeze({
    gfm: Object.freeze({ html: 'html', markup: 'markup', ast: { type: 'gfm' } }),
    'gfm-ex': Object.freeze({ markup: 'extended markup' }),
    yozora: Object.freeze({}),
  })

  expect(resolveAnswer(answer, 'yozora').markup).toBe('extended markup')
  expect(answer.yozora).toEqual({})
  expect(answer['gfm-ex']).toEqual({ markup: 'extended markup' })
})
