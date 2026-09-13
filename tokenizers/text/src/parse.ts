import { TextType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: readonly INodePoint[] = api.getNodePoints()
        let value = calcEscapedStringFromNodePoints(nodePoints, token.startIndex, token.endIndex)
        value = stripSpaces(value)
        const node: INode = api.shouldReservePosition
          ? { type: TextType, position: api.calcPosition(token), value }
          : { type: TextType, value }
        return node
      }),
  }
}

/**
 * Trim ASCII spaces and tabs next to LF, preserving all other text.
 * Equivalent to this replacement, but with O(n) worst-case work:
 *
 * ```ts
 * const pattern = new RegExp(String.raw`[ \t]*\n[ \t]*`, 'g')
 * text.replace(pattern, '\n')
 * ```
 *
 * The original regex can take O(n^2): when no LF follows a whitespace run,
 * it retries a suffix of that run from each starting position.
 *
 * ```ts
 * 'a' + ' '.repeat(n) + 'b'
 * 'before \na' + ' '.repeat(n) + 'b'
 * ```
 *
 * Group 1 keeps a matched LF. When no LF follows, the fallback consumes and
 * captures the entire whitespace run as group 2. `$1$2` preserves either
 * capture, and the next search starts after the run rather than inside it.
 *
 * The guard skips replacement unless trimming is needed. Once it is needed,
 * replacement processes all whitespace runs, including those kept unchanged.
 *
 * @see https://github.github.com/gfm/#example-670
 */
function stripSpaces(text: string): string {
  if (text.length < 2 || !/[ \t]\n|\n[ \t]/.test(text)) return text
  return text.replace(/[ \t]*(\n)[ \t]*|([ \t]+)/g, '$1$2')
}
