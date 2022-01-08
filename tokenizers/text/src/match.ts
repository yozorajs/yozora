import { TextType } from '@yozora/ast'
import type { IMatchInlineHookCreator } from '@yozora/core-tokenizer'
import { genFindDelimiter } from '@yozora/core-tokenizer'
import type { IDelimiter, IThis, IToken, T } from './types'

/**
 * Any characters not given an interpretation by the other tokenizer will be
 * parsed as plain textual content.
 *
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function () {
  return {
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
  }
}
