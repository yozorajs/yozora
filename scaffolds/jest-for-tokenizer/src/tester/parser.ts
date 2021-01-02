import type { DataNodeParser } from '@yozora/parser-core'
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
  parser: DataNodeParser
}


/**
 * Helper for testing block tokenizer
 */
export class ParserTester extends BaseTokenizerTester {
  public readonly parser: DataNodeParser

  public constructor(props: ParserTesterProps) {
    const { caseRootDirectory, parser } = props
    super(caseRootDirectory)
    this.parser = parser
  }

  /**
   * @override
   */
  protected testCase(useCase: TokenizerUseCase): void {
    const self = this
    const { description, input } = useCase
    test(description, async function () {
      const output = self.parser.parse(input)
      const formattedOutput = self.format(output)
      expect(useCase.parseAnswer).toEqual(formattedOutput)
    })
  }

  /**
   * @override
   */
  protected answerCase(useCase: TokenizerUseCase): Partial<TokenizerUseCase> {
    const output = this.parser.parse(useCase.input)
    const formattedOutput = this.format(output)
    return { parseAnswer: formattedOutput }
  }
}
