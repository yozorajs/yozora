import { ParagraphType } from '@yozora/ast'
import type {
  IBlockFallbackTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
  IPhrasingContentLine,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcPositionFromPhrasingContentLines,
  trimBlankLines,
} from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { INode, IThis, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Paragraph.
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer
  extends BaseBlockTokenizer<T, IToken, INode, IThis>
  implements IBlockFallbackTokenizer<T, IToken, INode, IThis>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FALLBACK,
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IThis> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IThis> = parse

  public override extractPhrasingContentLines(
    token: Readonly<IToken>,
  ): ReadonlyArray<IPhrasingContentLine> {
    return token.lines
  }

  public override buildBlockToken(
    _lines: ReadonlyArray<IPhrasingContentLine>,
  ): (IToken & IYastBlockToken) | null {
    const lines = trimBlankLines(_lines)
    if (lines.length <= 0) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    const token: IToken & IYastBlockToken = {
      _tokenizer: this.name,
      nodeType: ParagraphType,
      lines,
      position,
    }
    return token
  }
}
