import type {
  FallbackInlineTokenizer,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerContext,
  InlineTokenizerMatchPhaseState,
  YastInlineNode,
  YastInlineNodeType,
  YastInlineRoot,
} from '@yozora/tokenizercore-inline'
import type { TokenizerUseCase } from '../types'
import { calcEnhancedYastNodePoints } from '@yozora/tokenizercore'
import { DefaultInlineTokenizerContext } from '@yozora/tokenizercore-inline'
import { BaseTokenizerTester } from './base'


/**
 * Params for construct InlineTokenizerTester
 */
export interface InlineTokenizerTesterProps {
  /**
   * Link types
   */
  readonly linkTypes?: YastInlineNodeType[]
  /**
   * Root directory of the use cases located
   */
  readonly caseRootDirectory: string
  /**
   * Inline tokenizer context
   */
  readonly context?: InlineTokenizerContext
  /**
   * Fallback inline tokenizer
   */
  readonly fallbackTokenizer?:
    | FallbackInlineTokenizer<
      YastInlineNodeType & string,
      InlineTokenDelimiter & any,
      InlinePotentialToken & any,
      InlineTokenizerMatchPhaseState & any,
      YastInlineNode & any>
    | null
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
      linkTypes,
      fallbackTokenizer,
    } = props

    super(caseRootDirectory)
    this.context = context == null
      ? new DefaultInlineTokenizerContext({ linkTypes, fallbackTokenizer })
      : context
  }

  public parse(
    content: string,
    meta: Record<string, any> = {},
  ): YastInlineRoot {
    const nodePoints = calcEnhancedYastNodePoints(content)
    const startIndex = 0
    const endIndex = nodePoints.length

    const matchPhaseStateTree = this.context
      .match(nodePoints, meta, startIndex, endIndex)
    const postMatchPhaseStateTree = this.context
      .postMatch(nodePoints, meta, matchPhaseStateTree)
    const parsePhaseMetaTree = this.context
      .parse(nodePoints, meta, postMatchPhaseStateTree)
    return parsePhaseMetaTree
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
      const output = this.parse(input)
      const formattedOutput = this.format(output)
      return formattedOutput
    })
  }
}
