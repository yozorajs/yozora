import type {
  FallbackInlineTokenizer,
  InlineTokenizerContext,
  InlineTokenizerParsePhaseStateTree,
  RawContent,
} from '@yozora/tokenizercore-inline'
import type { TokenizerUseCase } from '../types'
import { calcYastNodePoints } from '@yozora/tokenizercore'
import { DefaultInlineTokenizerContext } from '@yozora/tokenizercore-inline'
import { BaseTokenizerTester } from './base'


/**
 * Params for construct InlineTokenizerTester
 */
export interface InlineTokenizerTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
  /**
   * Inline tokenizer context
   */
  context?: InlineTokenizerContext
  /**
   * Fallback inline tokenizer
   */
  fallbackTokenizer?: FallbackInlineTokenizer | null
}


/**
 * Helper for testing block tokenizer
 */
export class InlineTokenizerTester extends BaseTokenizerTester {
  public readonly context: InlineTokenizerContext

  public constructor(props: InlineTokenizerTesterProps) {
    const {
      caseRootDirectory,
      context,
      fallbackTokenizer,
    } = props

    super(caseRootDirectory)
    this.context = context == null
      ? new DefaultInlineTokenizerContext({ fallbackTokenizer })
      : context
  }

  public parse(
    content: string,
    meta: Record<string, any> = {},
  ): InlineTokenizerParsePhaseStateTree {
    const nodePoints = calcYastNodePoints(content)
    const startIndex = 0
    const endIndex = nodePoints.length

    const rawContent: RawContent = { nodePoints, meta }
    const matchPhaseStateTree = this.context.match(rawContent, startIndex, endIndex)
    const postMatchPhaseStateTree = this.context.postMatch(rawContent, matchPhaseStateTree)
    const parsePhaseMetaTree = this.context.parse(rawContent, postMatchPhaseStateTree)
    return parsePhaseMetaTree
  }

  /**
   * @override
   */
  protected testCase(useCase: TokenizerUseCase): void {
    const self = this
    const { description, input } = useCase
    test(description, async function () {
      const output = self.parse(input)
      const formattedOutput = self.format(output)
      expect(useCase.parseAnswer).toEqual(formattedOutput)
    })
  }

  /**
   * @override
   */
  protected answerCase(useCase: TokenizerUseCase): Partial<TokenizerUseCase> {
    const output = this.parse(useCase.input)
    const formattedOutput = this.format(output)
    return { parseAnswer: formattedOutput }
  }
}
