import type { IParser } from '@yozora/core-parser'
import { expect, test } from 'vitest'
import { resolveAnswer } from './answer'
import { BaseTester } from './BaseTester'
import type { IYozoraUseCase, ParserName } from './types'

/**
 * Params for construct TokenizerTester
 */
interface ITokenizerTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
  /**
   * Parser
   */
  parser: IParser
  /**
   * Parser whose expected answers are selected and updated.
   */
  parserName: ParserName
}

export class TokenizerTester<T = unknown> extends BaseTester<T> {
  public readonly parser: IParser
  public readonly parserName: ParserName

  constructor(props: ITokenizerTesterProps) {
    super(props)
    this.parser = props.parser
    this.parserName = props.parserName
  }

  /**
   * Create test for a single use case
   *
   * @param useCase
   * @param filepath
   */
  protected override _testCase(useCase: IYozoraUseCase<T>, filepath: string): void {
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
   * @param useCase
   * @param filepath
   */
  protected override _answerCase(
    useCase: IYozoraUseCase<T>,
    filepath: string,
  ): Partial<IYozoraUseCase<T>> {
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
   * @param input
   * @param filepath
   */
  protected _parseAndFormat(input: string, filepath: string): any {
    return this.carefulProcess<any>(filepath, () => {
      const output = this.parser.parse(input)
      const formattedOutput = this.format(output)
      return formattedOutput
    })
  }
}
