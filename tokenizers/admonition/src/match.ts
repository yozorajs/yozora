import type { IMatchBlockHook, IMatchBlockHookCreator } from '@yozora/core-tokenizer'
import { fencedBlockMatch } from '@yozora/tokenizer-fenced-block'
import type { IThis, IToken, T } from './types'

/**
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code
 * block begins with a code fence, indented no more than three spaces.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function (api) {
  const hook = fencedBlockMatch.call(this, api) as IMatchBlockHook<T, IToken>
  return {
    ...hook,
    isContainingBlock: true,
    onClose,
  }

  function onClose(token: IToken): void {
    const children = api.rollbackPhrasingLines(token.lines)

    token.children = children
  }
}
