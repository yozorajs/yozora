import type { YastParser } from '@yozora/parser-core'
import type { TokenizerUseCase } from '../types'
import { BaseTokenizerTester } from './base'


/**
 * Params for construct ParserTester
 */
export interface ParserTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
  /**
   * Parser
   */
  parser: YastParser
}


/**
 * Helper for testing block tokenizer
 */
export class ParserTester extends BaseTokenizerTester {
  public readonly parser: YastParser

  public constructor(props: ParserTesterProps) {
    const { caseRootDirectory, parser } = props
    super(caseRootDirectory)
    this.parser = parser
  }

  /**
   * @override
   */
  protected testCase(useCase: TokenizerUseCase, filepath: string): void {
    const self = this
    const { description, input } = useCase
    test(description, async function () {
      const parseAnswer = self._parseAndFormat(input, filepath)
      expect(useCase.parseAnswer).toEqual(parseAnswer)
    })
  }

  /**
   * @override
   */
  protected answerCase(useCase: TokenizerUseCase, filepath: string): Partial<TokenizerUseCase> {
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
  private _parseAndFormat(input: string, filepath: string): any {
    return this.trackHandle<any>(filepath, () => {
      const output = this.parser.parse(input)
      const formattedOutput = this.format(output)
      return formattedOutput
    })
  }
}
