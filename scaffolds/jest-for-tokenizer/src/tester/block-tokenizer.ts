import type {
  YastMeta,
  YastNode,
  YastParent,
  YastRoot,
} from '@yozora/tokenizercore'
import type {
  BlockTokenizerContext,
  FallbackBlockTokenizer,
  PhrasingContent,
  YastBlockNode,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type { TokenizerUseCase } from '../types'
import {
  calcEnhancedYastNodePoints,
  calcStringFromNodePoints,
} from '@yozora/tokenizercore'
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

  public parse(content: string): YastRoot {
    const nodePoints = calcEnhancedYastNodePoints(content)
    const startIndex = 0
    const endIndex = nodePoints.length

    const matchPhaseStateTree = this.context.match(nodePoints, startIndex, endIndex)
    const postMatchPhaseStateTree = this.context.postMatch(nodePoints, matchPhaseStateTree)
    const parsePhaseStateTree = this.context.parse(nodePoints, postMatchPhaseStateTree)
    const postParsePhaseStateTree = this.context.postParse(nodePoints, parsePhaseStateTree)
    const root = this.deepParse(postParsePhaseStateTree as any, postParsePhaseStateTree.meta)
    return root as YastRoot
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
   * Format phrasingContent.contents
   *
   * @param o
   * @param meta
   */
  protected deepParse(o: YastBlockNode & YastParent, meta: YastMeta): YastBlockNode {
    if (o.children != null && o.children.length > 0) {
      const children: YastNode[] = []
      for (const u of o.children) {
        if (u.type === PhrasingContentType) {
          const phrasingContent = u as PhrasingContent
          const v = {
            ...phrasingContent,
            contents: calcStringFromNodePoints(phrasingContent.contents),
          }
          children.push(v)
        } else {
          const v = this.deepParse(u as YastBlockNode & YastParent, meta)
          children.push(v)
        }
      }
      // eslint-disable-next-line no-param-reassign
      o.children = children
    }
    return o
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
