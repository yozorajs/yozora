// @ts-check

import { AdmonitionType, ImageReferenceType, LinkReferenceType, TextType } from '@yozora/ast'
import { removePositions } from '@yozora/ast-util'
import { expect, test } from 'vitest'
import { resolveAnswer } from './answer.mjs'
import { BaseTester } from './base-tester.mjs'

/**
 * @import {
 *   Admonition,
 *   ImageReference,
 *   LinkReference,
 *   Node,
 *   Parent,
 *   Root,
 *   Text,
 * } from '@yozora/ast'
 */
/** @import { IMarkupWeaver } from '@yozora/markup-gfm' */
/** @import { IParser } from '@yozora/parser' */
/** @import { IYozoraUseCase, ParserName } from './types.mjs' */

/** @typedef {{ caseRootDirectory: string, parser: IParser, parserName: ParserName, weaver: IMarkupWeaver }} IMarkupTesterProps */

/** Existing markup round-trip exclusions, retained during the package split. */
export const markupFixtureSelection = {
  excludeExamples: [
    '#036',
    '#310',
    '#333',
    '#334',
    '#335',
    '#336',
    '#337',
    '#359',
    '#503',
    '#535',
    '#554',
    '#572',
    '#601',
    '#602',
    '#615',
    '#625',
    '#626',
    '#629',
    '#632',
  ],
}

/**
 * @template [T=unknown]
 * @extends {BaseTester<T>}
 */
export class MarkupTester extends BaseTester {
  /**
   * @readonly
   * @type {IParser}
   */
  parser
  /**
   * @readonly
   * @type {ParserName}
   */
  parserName
  /**
   * @readonly
   * @type {IMarkupWeaver}
   */
  weaver

  /** @param {IMarkupTesterProps} props */
  constructor(props) {
    super(props)
    this.parser = props.parser
    this.parserName = props.parserName
    this.weaver = props.weaver
  }

  /**
   * Create test for a single use case
   *
   * @protected
   * @override
   * @param {IYozoraUseCase<T>} useCase
   * @param {string} filepath
   * @returns {void}
   */
  _testCase(useCase, filepath) {
    const { description, input } = useCase

    test(description, async () => {
      const answer = resolveAnswer(useCase.answer, this.parserName)
      expect(answer.markup, `Missing answer.${this.parserName}.markup in ${filepath}`).toBeDefined()
      const { markup, expectedAst, receivedAst } = this._weaveAndFormat(input, filepath)
      expect(markup).toEqual(answer.markup)
      if (!this._areSameAST(receivedAst, expectedAst)) {
        expect(receivedAst).toEqual(expectedAst)
      }
    })
  }

  /**
   * Create an answer for a single use case
   *
   * @protected
   * @override
   * @param {IYozoraUseCase<T>} useCase
   * @param {string} filepath
   * @returns {Partial<IYozoraUseCase<T>>}
   */
  _answerCase(useCase, filepath) {
    const { markup } = this._weaveAndFormat(useCase.input, filepath)
    return {
      answer: {
        ...useCase.answer,
        [this.parserName]: { ...useCase.answer[this.parserName], markup },
      },
    }
  }

  /**
   * Parse and format.
   * Print case filepath when it failed.
   *
   * @protected
   * @param {string} input
   * @param {string} filepath
   * @returns {{ markup: string, expectedAst: Root, receivedAst: Root }}
   */
  _weaveAndFormat(input, filepath) {
    return this.carefulProcess(filepath, () => {
      const expectedAst = this.parser.parse(input, { shouldReservePosition: true })
      const markup = this.weaver.weave(expectedAst)
      const receivedAst = this.parser.parse(markup, { shouldReservePosition: true })
      return {
        markup,
        expectedAst: this._normalizeAst(expectedAst),
        receivedAst: this._normalizeAst(receivedAst),
      }
    })
  }

  /**
   * @protected
   * @param {Node} node1
   * @param {Node} node2
   * @returns {boolean}
   */
  _areSameAST(node1, node2) {
    const { children: children1, ...data1 } = /** @type {Parent} */ (node1)
    const { children: children2, ...data2 } = /** @type {Parent} */ (node2)

    if (node1.type !== node2.type) return false
    switch (node1.type) {
      case AdmonitionType: {
        const { title: title1, ...o1 } = /** @type {Admonition} */ (data1)
        const { title: title2, ...o2 } = /** @type {Admonition} */ (data2)
        if (title1.length !== title2.length) return false
        for (let i = 0; i < title1.length; ++i) {
          if (!this._areSameAST(title1[i], title2[i])) return false
        }
        if (!this._areSomeObject(o1, o2)) return false
        break
      }
      case LinkReferenceType:
      case ImageReferenceType: {
        const { referenceType: _r1, ...o1 } = /** @type {LinkReference | ImageReference} */ (data1)
        const { referenceType: _r2, ...o2 } = /** @type {LinkReference | ImageReference} */ (data2)
        if (!this._areSomeObject(o1, o2)) return false
        break
      }
      case TextType: {
        const { value: v1 } = /** @type {Text} */ (node1)
        const { value: v2 } = /** @type {Text} */ (node2)
        if (v1 !== v2) return false
        break
      }
      default:
        if (!this._areSomeObject(data1, data2)) return false
        break
    }

    if (children1 || children2) {
      if (children1?.length !== children2?.length) return false
      const _size = children1.length
      for (let i = 0; i < _size; ++i) {
        if (!this._areSameAST(children1[i], children2[i])) return false
      }
    }
    return true
  }

  /**
   * @protected
   * @param {Record<string, unknown>} o1
   * @param {Record<string, unknown>} o2
   * @returns {boolean}
   */
  _areSomeObject(o1, o2) {
    const keys1 = Object.keys(o1)
    const keys2 = Object.keys(o2)
    if (keys1.length !== keys2.length) return false
    for (const key of keys1) {
      if (o1[key] !== o2[key]) return false
    }
    return true
  }

  /**
   * @protected
   * @param {Root} ast
   * @returns {Root}
   */
  _normalizeAst(ast) {
    const root = removePositions(ast)
    const content = JSON.stringify(root)
    return JSON.parse(content)
  }
}

/**
 * Compare each flavor's AST without imposing another flavor's markup spelling.
 * @extends {MarkupTester<unknown>}
 */
export class RoundTripMarkupTester extends MarkupTester {
  /**
   * @protected
   * @override
   * @param {IYozoraUseCase} useCase
   * @param {string} filepath
   * @returns {void}
   */
  _testCase(useCase, filepath) {
    test(useCase.description, () => {
      const { expectedAst, receivedAst } = this._weaveAndFormat(useCase.input, filepath)
      if (!this._areSameAST(receivedAst, expectedAst)) expect(receivedAst).toEqual(expectedAst)
    })
  }
}
