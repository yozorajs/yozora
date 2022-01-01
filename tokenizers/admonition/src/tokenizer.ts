import type { IYastNode } from '@yozora/ast'
import { AdmonitionType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  IMatchBlockPhaseApi,
  IParseBlockPhaseApi,
  IPhrasingContentLine,
  IResultOfParse,
  ITokenizer,
  ITokenizerMatchBlockHook,
  ITokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  TokenizerPriority,
  eatOptionalWhitespaces,
} from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import type { INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Admonition.
 *
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code
 * block begins with a code fence, indented no more than three spaces.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export class AdmonitionTokenizer
  extends FencedBlockTokenizer<T>
  implements
    ITokenizer,
    ITokenizerMatchBlockHook<T, IToken>,
    ITokenizerParseBlockHook<T, IToken, INode>
{
  public override readonly isContainingBlock = true

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
      nodeType: AdmonitionType,
      markers: [AsciiCodePoint.COLON],
      markersRequired: 3,
    })
  }

  /**
   * Resolve children.
   * @override
   * @see ITokenizerMatchBlockHook
   */
  public onClose(token: IToken, api: IMatchBlockPhaseApi): void {
    const children = api.rollbackPhrasingLines(token.lines)
    // eslint-disable-next-line no-param-reassign
    token.children = children
  }

  /**
   * @override
   * @see ITokenizerParseBlockHook
   */
  public parseBlock(
    token: IToken,
    children: IYastNode[],
    api: Readonly<IParseBlockPhaseApi>,
  ): IResultOfParse<T, INode> {
    const infoString = token.infoString

    // Match an admonition keyword.
    let i = 0
    const keyword: INodePoint[] = []
    for (; i < infoString.length; ++i) {
      const p = infoString[i]
      if (isUnicodeWhitespaceCharacter(p.codePoint)) break
      keyword.push(p)
    }

    i = eatOptionalWhitespaces(infoString, i, infoString.length)
    const title: IYastNode[] = ((): IYastNode[] => {
      if (i >= infoString.length) return []
      const titleLines: IPhrasingContentLine[] = [
        {
          nodePoints: infoString,
          startIndex: i,
          endIndex: infoString.length,
          firstNonWhitespaceIndex: i,
          countOfPrecedeSpaces: 0,
        },
      ]
      const phrasingContent = api.buildPhrasingContent(titleLines)
      if (phrasingContent == null) return []
      return api.parsePhrasingContent(phrasingContent)
    })()

    const node: INode = {
      type: AdmonitionType,
      keyword: calcEscapedStringFromNodePoints(
        keyword,
        0,
        keyword.length,
        true,
      ),
      title,
      children,
    }
    return node
  }
}
