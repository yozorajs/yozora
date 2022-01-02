import { TextType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import type {
  IInlineFallbackTokenizer,
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority, genFindDelimiter } from '@yozora/core-tokenizer'
import type { IDelimiter, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Text.
 *
 * Any characters not given an interpretation by the other tokenizer will be
 * parsed as plain textual content.
 *
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 */
export class TextTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode>
  implements
    IInlineTokenizer<T, IDelimiter, IToken, INode>,
    IInlineFallbackTokenizer<T, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FALLBACK,
    })
  }

  public findAndHandleDelimiter(startIndex: number, endIndex: number): IToken {
    const token: IToken = {
      nodeType: TextType,
      startIndex,
      endIndex,
    }
    return token
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken> = () => ({
    findDelimiter: () =>
      genFindDelimiter<IDelimiter>((startIndex, endIndex) => ({
        type: 'full',
        startIndex,
        endIndex,
      })),
    /* istanbul ignore next */
    processSingleDelimiter: delimiter => [
      {
        nodeType: TextType,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
      },
    ],
  })

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode> = api => ({
    parse: token => {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
      const { startIndex, endIndex } = token
      let value: string = calcEscapedStringFromNodePoints(nodePoints, startIndex, endIndex)

      /**
       * Spaces at the end of the line and beginning of the next line are removed
       * @see https://github.github.com/gfm/#example-670
       */
      value = value.replace(/[^\S\n]*\n[^\S\n]*/g, '\n')
      const result: INode = { type: TextType, value }
      return result
    },
  })
}
