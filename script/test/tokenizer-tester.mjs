// @ts-check

import { expect, test } from 'vitest'
import { resolveAnswer } from './answer.mjs'
import { BaseTester } from './base-tester.mjs'

/** @import { IParser } from '@yozora/parser' */
/** @import { IYozoraUseCase, ParserName } from './types.mjs' */

/** @typedef {{ caseRootDirectory: string, parser: IParser, parserName: ParserName }} ITokenizerTesterProps */

/**
 * @template [T=unknown]
 * @extends {BaseTester<T>}
 */
export class TokenizerTester extends BaseTester {
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

  /** @param {ITokenizerTesterProps} props */
  constructor(props) {
    super(props)
    this.parser = props.parser
    this.parserName = props.parserName
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
      expect(answer.ast, `Missing answer.${this.parserName}.ast in ${filepath}`).toBeDefined()
      const ast = this._parseAndFormat(input, filepath)
      expect(ast).toEqual(answer.ast)
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
    const ast = this._parseAndFormat(useCase.input, filepath)
    return {
      answer: {
        ...useCase.answer,
        [this.parserName]: { ...useCase.answer[this.parserName], ast },
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
   * @returns {any}
   */
  _parseAndFormat(input, filepath) {
    return this.carefulProcess(filepath, () => {
      const output = this.parser.parse(input)
      const formattedOutput = this.format(output)
      return formattedOutput
    })
  }
}
