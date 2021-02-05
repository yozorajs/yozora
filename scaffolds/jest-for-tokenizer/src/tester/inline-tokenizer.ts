import type { NodePoint } from '@yozora/character'
import type { YastMeta, YastRoot } from '@yozora/tokenizercore'
import type {
  FallbackInlineTokenizer,
  InlineTokenizerContext,
  InlineTokenizerMatchPhaseState,
  YastInlineNode,
  YastInlineNodeType,
} from '@yozora/tokenizercore-inline'
import type { TokenizerUseCase } from '../types'
import { createNodePointGenerator } from '@yozora/character'
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
  readonly fallbackTokenizer?: FallbackInlineTokenizer<
    YastInlineNodeType,
    YastMeta & any,
    InlineTokenizerMatchPhaseState & any,
    YastInlineNode & any>
}


/**
 * Helper for testing block tokenizer
 */
export class InlineTokenizerTester extends BaseTokenizerTester {
  public readonly context: InlineTokenizerContext

  public constructor(props: InlineTokenizerTesterProps) {
    const { caseRootDirectory, context, fallbackTokenizer } = props
    super(caseRootDirectory)
    this.context = context == null
      ? new DefaultInlineTokenizerContext({ fallbackTokenizer })
      : context
  }

  public parse(
    content: string,
    meta: Record<string, any> = {},
  ): YastRoot {
    const nodePointGenerator = createNodePointGenerator(content)
    const nodePoints: NodePoint[] = nodePointGenerator.next(null).value!
    const startIndex = 0
    const endIndex = nodePoints.length

    let states = this.context.match(startIndex, endIndex, nodePoints, meta)
    states = this.context.postMatch(states, nodePoints, meta)
    const nodes = this.context.parse(states, nodePoints, meta)
    return {
      type: 'root',
      children: nodes,
    }
  }

  /**
   * @override
   */
  protected testCase(useCase: TokenizerUseCase, filepath: string): void {
    const self = this
    const { description, input } = useCase
    test(description, async function () {
      const parseAnswer = self._parseAndFormat(input, filepath)
      expect(parseAnswer).toEqual(useCase.parseAnswer)
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
