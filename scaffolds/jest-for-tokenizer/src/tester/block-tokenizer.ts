import type {
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerParsePhaseState,
  BlockTokenizerParsePhaseStateTree,
  BlockTokenizerPostParsePhaseHook,
  FallbackBlockTokenizer,
} from '@yozora/tokenizercore-block'
import type { InlineDataNode } from '@yozora/tokenizercore-inline'
import type { TokenizerUseCase } from '../types'
import { calcDataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { DefaultBlockTokenizerContext } from '@yozora/tokenizercore-block'
import { PhrasingContentDataNodeType } from '@yozora/tokenizercore-block'
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
  fallbackTokenizer: this['context'] extends null
  ? null | undefined
  : FallbackBlockTokenizer
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
      fallbackTokenizer,
    } = props
    super(caseRootDirectory)
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
    shouldDeepParseTypes: BlockDataNodeType[] = [PhrasingContentDataNodeType],
  ): BlockTokenizer & BlockTokenizerPostParsePhaseHook {
    const inlineDataTokenizer: BlockTokenizer & BlockTokenizerPostParsePhaseHook = {
      name: '__inline-data__',
      priority: 0,
      uniqueTypes: [],
      transformParse: (meta, states) => {
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
          } as InlineDataNode

          u.contents = [inlineDataNode]
          return u
        })
      }
    }
    return inlineDataTokenizer
  }

  public parse(content: string): BlockTokenizerParsePhaseStateTree {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const preMatchPhaseStateTree = this.context.preMatch(codePositions, startIndex, endIndex)
    const matchPhaseStateTree = this.context.match(preMatchPhaseStateTree)
    const postMatchPhaseStateTree = this.context.postMatch(matchPhaseStateTree)
    const preParsePhaseTree = this.context.preParse(postMatchPhaseStateTree)
    const parsePhaseStateTree = this.context.parse(postMatchPhaseStateTree, preParsePhaseTree)
    const postParsePhaseStateTree = this.context.postParse(parsePhaseStateTree)
    return postParsePhaseStateTree
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
