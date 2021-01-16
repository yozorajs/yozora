import type {
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerContextParsePhaseStateTree,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostParsePhaseHook,
  FallbackBlockTokenizer,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type { YastInlineNode } from '@yozora/tokenizercore-inline'
import type { TokenizerUseCase } from '../types'
import { calcEnhancedYastNodePoints } from '@yozora/tokenizercore'
import {
  PhrasingContentTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { DefaultBlockTokenizerContext } from '@yozora/tokenizercore-block'
import { BaseTokenizerTester } from './base'


/**
 * Params for construct BlockTokenizerTester
 */
export interface BlockTokenizerTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
  /**
   * Inline tokenizer context
   */
  context?: BlockTokenizerContext
  /**
   * Fallback inline tokenizer
   */
  fallbackTokenizer?: FallbackBlockTokenizer<YastBlockNodeType, any, any>
}


/**
 * Helper for testing block tokenizer
 */
export class BlockTokenizerTester extends BaseTokenizerTester {
  public readonly context: BlockTokenizerContext

  public constructor(props: BlockTokenizerTesterProps) {
    const {
      caseRootDirectory,
      context,
    } = props
    super(caseRootDirectory)

    const fallbackTokenizer: FallbackBlockTokenizer<YastBlockNodeType & any, any, any> =
      props.fallbackTokenizer || new PhrasingContentTokenizer()
    this.context = context == null
      ? new DefaultBlockTokenizerContext({ fallbackTokenizer })
      : context
  }

  /**
   * Create default tokenizer for parse inline data
   *
   * @param shouldDeepParseTypes
   */
  public static defaultInlineDataTokenizer(
    shouldDeepParseTypes: YastBlockNodeType[] = [PhrasingContentType],
  ): BlockTokenizer & BlockTokenizerPostParsePhaseHook {
    const inlineDataTokenizer: BlockTokenizer & BlockTokenizerPostParsePhaseHook = {
      name: '__inline-data__',
      uniqueTypes: [],
      interruptableTypes: [],
      getContext: () => null,
      couldInterruptPreviousSibling: () => false,
      transformParse: (states) => {
        return states.map(o => {
          const u = o as BlockTokenizerParsePhaseState & { contents: any[] }
          if (
            shouldDeepParseTypes.indexOf(u.type) < 0 ||
            !Array.isArray(u.contents)
          ) return u

          const inlineDataNode = {
            type: 'TEXT',
            content: u.contents
              .slice(0, u.contents.length)
              .map(c => String.fromCodePoint(c.codePoint))
              .join(''),
          } as YastInlineNode

          u.contents = [inlineDataNode]
          return u
        })
      }
    }
    return inlineDataTokenizer
  }

  public parse(content: string): BlockTokenizerContextParsePhaseStateTree {
    const nodePoints = calcEnhancedYastNodePoints(content)
    const startIndex = 0
    const endIndex = nodePoints.length

    const matchPhaseStateTree = this.context.match(nodePoints, startIndex, endIndex)
    const postMatchPhaseStateTree = this.context.postMatch(matchPhaseStateTree)
    const parsePhaseStateTree = this.context.parse(postMatchPhaseStateTree)
    const postParsePhaseStateTree = this.context.postParse(parsePhaseStateTree)
    return postParsePhaseStateTree
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
