import { CodeType } from '@yozora/ast'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IBlockTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
} from '@yozora/core-tokenizer'
import { TokenizerPriority } from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import { match } from './match'
import { parse } from './parse'
import type { INode, IThis, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for FencedCode.
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export class FencedCodeTokenizer
  extends FencedBlockTokenizer<T, INode, IThis>
  implements IBlockTokenizer<T, IToken, INode, IThis>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
      nodeType: CodeType,
      markers: [AsciiCodePoint.BACKTICK, AsciiCodePoint.TILDE],
      markersRequired: 3,
      checkInfoString: (infoString, marker): boolean => {
        /**
         * Info strings for backtick code blocks cannot contain backticks:
         * Info strings for tilde code blocks can contain backticks and tildes
         * @see https://github.github.com/gfm/#example-115
         * @see https://github.github.com/gfm/#example-116
         */
        if (marker === AsciiCodePoint.BACKTICK) {
          for (const p of infoString) {
            if (p.codePoint === AsciiCodePoint.BACKTICK) return false
          }
        }
        return true
      },
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IThis> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IThis> = parse
}
