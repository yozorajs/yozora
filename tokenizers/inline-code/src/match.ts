import { InlineCodeType } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IMatchInlineHookCreator,
  IResultOfFindDelimiters,
  IResultOfProcessSingleDelimiter,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'
import { eatOptionalCharacters } from '@yozora/core-tokenizer'
import type { IDelimiter, IThis, IToken, T } from './types'

/**
 * Syntax for images is like the syntax for links, with one difference. Instead
 * of link text, we have an image description. The rules for this are the same
 * as for link text, except that
 *
 *    (a) an image description starts with '![' rather than '[', and
 *    (b) an image description may contain links. An image description has
 *        inline elements as its contents. When an image is rendered to HTML,
 *        this is standardly used as the image’s alt attribute.
 *
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function (api) {
  return { findDelimiter, processSingleDelimiter }

  function* findDelimiter(): IResultOfFindDelimiters<IDelimiter> {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const blockStartIndex: number = api.getBlockStartIndex()
    const blockEndIndex: number = api.getBlockEndIndex()

    const potentialDelimiters: IYastTokenDelimiter[] = []
    for (let i = blockStartIndex; i < blockEndIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH: {
          i += 1
          if (i < blockEndIndex && nodePoints[i].codePoint === AsciiCodePoint.BACKTICK) {
            const j = eatOptionalCharacters(
              nodePoints,
              i + 1,
              blockEndIndex,
              AsciiCodePoint.BACKTICK,
            )

            /**
             * Note that backslash escapes do not work in code spans.
             * All backslashes are treated literally
             * @see https://github.github.com/gfm/#example-348
             */
            potentialDelimiters.push({
              type: 'closer',
              startIndex: i,
              endIndex: j,
            })

            if (j > i + 1) {
              potentialDelimiters.push({
                type: 'opener',
                startIndex: i + 1,
                endIndex: j,
              })
            }

            i = j - 1
          }
          break
        }
        /**
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * A code span begins with a backtick string and ends with a
         * backtick string of equal length.
         * @see https://github.github.com/gfm/#backtick-string
         * @see https://github.github.com/gfm/#code-span
         */
        case AsciiCodePoint.BACKTICK: {
          const _startIndex = i

          // matched as many backtick as possible
          const endIndexOfBacktick = eatOptionalCharacters(nodePoints, i + 1, blockEndIndex, c)

          potentialDelimiters.push({
            type: 'both',
            startIndex: _startIndex,
            endIndex: endIndexOfBacktick,
          })

          i = endIndexOfBacktick - 1
          break
        }
      }
    }

    let pIndex = 0
    let lastEndIndex = -1
    let delimiter: IDelimiter | null = null
    while (pIndex < potentialDelimiters.length) {
      const [startIndex, endIndex] = yield delimiter

      // Read from cache.
      if (lastEndIndex === endIndex) {
        if (delimiter == null || delimiter.startIndex >= startIndex) continue
      }
      lastEndIndex = endIndex

      let openerDelimiter: INodeInterval | null = null
      let closerDelimiter: INodeInterval | null = null
      for (; pIndex < potentialDelimiters.length; ++pIndex) {
        for (; pIndex < potentialDelimiters.length; ++pIndex) {
          const delimiter = potentialDelimiters[pIndex]
          if (delimiter.startIndex >= startIndex && delimiter.type !== 'closer') break
        }
        if (pIndex + 1 >= potentialDelimiters.length) return

        openerDelimiter = potentialDelimiters[pIndex]
        const thickness = openerDelimiter.endIndex - openerDelimiter.startIndex
        for (let i = pIndex + 1; i < potentialDelimiters.length; ++i) {
          const delimiter = potentialDelimiters[i]
          if (
            delimiter.type !== 'opener' &&
            delimiter.endIndex - delimiter.startIndex === thickness
          ) {
            closerDelimiter = delimiter
            break
          }
        }

        // No matched inlineCode closer marker found, try next one.
        if (closerDelimiter != null) break
      }

      if (closerDelimiter == null) return

      delimiter = {
        type: 'full',
        startIndex: openerDelimiter!.startIndex,
        endIndex: closerDelimiter.endIndex,
        thickness: closerDelimiter.endIndex - closerDelimiter.startIndex,
      }
    }
  }

  function processSingleDelimiter(
    delimiter: IDelimiter,
  ): IResultOfProcessSingleDelimiter<T, IToken> {
    const token: IToken = {
      nodeType: InlineCodeType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
      thickness: delimiter.thickness,
    }
    return [token]
  }
}
