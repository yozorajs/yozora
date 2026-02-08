import type { IParser } from '@yozora/core-parser'
import { expect, test } from 'vitest'
import { BaseTester } from './BaseTester'
import type { IYozoraUseCase } from './types'

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
}

export class TokenizerTester<T = unknown> extends BaseTester<T> {
  public readonly parser: IParser

  constructor(props: ITokenizerTesterProps) {
    super(props)
    this.parser = props.parser
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
      const parseAnswer = this._parseAndFormat(input, filepath)
      expect(parseAnswer).toEqual(useCase.parseAnswer)
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
    const parseAnswer = this._parseAndFormat(useCase.input, filepath)
    return { parseAnswer }
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
