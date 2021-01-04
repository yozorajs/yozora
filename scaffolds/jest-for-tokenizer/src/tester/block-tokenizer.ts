import type {
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerParsePhaseState,
  BlockTokenizerParsePhaseStateTree,
  BlockTokenizerPostParsePhaseHook,
  FallbackBlockTokenizer,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type { YastInlineNode } from '@yozora/tokenizercore-inline'
import type { TokenizerUseCase } from '../types'
import { calcYastNodePoints } from '@yozora/tokenizercore'
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

    const fallbackTokenizer: FallbackBlockTokenizer<YastBlockNodeType, any, any> =
      props.fallbackTokenizer || new PhrasingContentTokenizer({ priority: -1 })
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
          } as YastInlineNode

          u.contents = [inlineDataNode]
          return u
        })
      }
    }
    return inlineDataTokenizer
  }

  public parse(content: string): BlockTokenizerParsePhaseStateTree {
    const nodePoints = calcYastNodePoints(content)
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
