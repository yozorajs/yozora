import { CodePoint } from '../_constant/character'
import { DataNodeTokenPointDetail } from '../_types/token'
import { InlineDataNodeParseFunc, InlineDataNodeTokenizerContext } from '../inline/types'
import {
  BlockDataNode,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructor,
  BlockDataNodeTokenizerConstructorParams,
  BlockDataNodeTokenizerContext,
  BlockDataNodeType,
} from './types'
import { isUnicodeWhiteSpace } from '../_util/character'


interface ContextMap {
  inlineContext?: InlineDataNodeTokenizerContext,
}


/**
 * 块状数据的分词器的上下文
 */
export class DefaultBlockDataNodeTokenizerContext implements BlockDataNodeTokenizerContext {
  protected readonly tokenizers: BlockDataNodeTokenizer[]
  protected readonly tokenizerMap: Map<BlockDataNodeType, BlockDataNodeTokenizer>
  protected readonly fallbackTokenizer?: BlockDataNodeTokenizer
  protected readonly inlineContext?: InlineDataNodeTokenizerContext
  protected readonly inlineDataNodeParseFunc?: InlineDataNodeParseFunc

  public constructor(
    FallbackTokenizerOrTokenizerConstructor?: BlockDataNodeTokenizer | BlockDataNodeTokenizerConstructor,
    fallbackTokenizerParams?: BlockDataNodeTokenizerConstructorParams,
    contextMap: ContextMap = {}
  ) {
    this.tokenizers = []
    this.tokenizerMap = new Map()

    if (contextMap.inlineContext != null) {
      this.inlineContext = contextMap.inlineContext
      this.inlineDataNodeParseFunc = this.inlineContext.parse.bind(this.inlineContext)
    }

    if (FallbackTokenizerOrTokenizerConstructor != null) {
      let fallbackTokenizer: BlockDataNodeTokenizer
      if (typeof FallbackTokenizerOrTokenizerConstructor === 'function') {
        fallbackTokenizer = new FallbackTokenizerOrTokenizerConstructor({
          priority: -1,
          name: '__block_fallback__',
          ...fallbackTokenizerParams,
        })
      } else {
        fallbackTokenizer = FallbackTokenizerOrTokenizerConstructor
      }
      this.fallbackTokenizer = fallbackTokenizer
      this.registerTokenizer(fallbackTokenizer)
    }
  }

  /**
   * override
   */
  public useTokenizer(tokenizer: BlockDataNodeTokenizer): this {
    const self = this
    self.tokenizers.push(tokenizer)
    self.tokenizers.sort((x, y) => y.priority - x.priority)
    self.registerTokenizer(tokenizer)
    return this
  }

  /**
   * override
   */
  public match(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
  ): BlockDataNodeMatchResult[] {
    const self = this
    const root: BlockDataNodeMatchState = {
      type: 'root',
      opening: true,
      children: [],
    }

    for (let i = startIndex, lineEndIndex: number; i < endIndex; i = lineEndIndex) {
      for (lineEndIndex = i; lineEndIndex < endIndex; ++lineEndIndex) {
        if (codePoints[lineEndIndex].codePoint === CodePoint.LINE_FEED) {
          ++lineEndIndex
          break
        }
      }

      /**
       * 使用 firstNonWhiteSpaceIndex 记录当前行剩余内容中第一个非空白符的下标，
       * 使得 isBlankLine() 无论掉用多少次，复杂度都是 O(lineEndIndex-i)
       */
      let firstNonWhiteSpaceIndex = i
      const isBlankLine = (): boolean => {
        while (firstNonWhiteSpaceIndex < lineEndIndex) {
          const c = codePoints[firstNonWhiteSpaceIndex]
          if (!isUnicodeWhiteSpace(c.codePoint)) break
          firstNonWhiteSpaceIndex += 1
        }
        return true
      }

      /**
       * 匹配成功，往前进行移动
       * @param nextIndex
       */
      const moveToNext = (nextIndex: number) => {
        i = nextIndex
        firstNonWhiteSpaceIndex = Math.max(firstNonWhiteSpaceIndex + 1, nextIndex)
      }

      /**
       * Step 1: First we iterate through the open blocks, starting with the
       *         root document, and descending through last children down to
       *         the last open block. Each block imposes a condition that the
       *         line must satisfy if the block is to remain open.
       * @see https://github.github.com/gfm/#phase-1-block-structure
       */
      let parent: BlockDataNodeMatchState = root
      if (parent.children != null && parent.children.length > 0) {
        let state: BlockDataNodeMatchState = parent.children[parent.children.length - 1]
        while (state.opening) {
          const tokenizer = self.tokenizerMap.get(state.type)
          if (tokenizer == null) break

          const [nextIndex, success] = tokenizer.eatContinuationText(
            codePoints, i, lineEndIndex, isBlankLine(), state)
          if (!success) break
          moveToNext(nextIndex)

          // descending through last children down to the next open block
          if (state.children == null || state.children.length <= 0) break
          const lastChild = state.children[state.children.length - 1]
          if (!lastChild.opening) break
          parent = state
          state = lastChild
        }
      }

      /**
       * Step 2: Next, after consuming the continuation markers for existing blocks,
       *         we look for new block starts (e.g. > for a block quote)
       */
      if (i < lineEndIndex) {
        for (let firstMatched = true; i < lineEndIndex;) {
          for (const tokenizer of self.tokenizers) {
            const [nextIndex, state] = tokenizer.eatMarker(
              codePoints, i, lineEndIndex, isBlankLine(), parent)

            if (state == null) break
            moveToNext(nextIndex)

            /**
             * If we encounter a new block start, we close any blocks unmatched
             * in step 1 before creating the new block as a child of the last matched block
             */
            if (firstMatched) firstMatched = false
            else {
              self.recursivelyCloseState(parent)
            }

            parent.children?.push(state)
          }
        }
      }

      if (i >= lineEndIndex) continue

      /**
       * Step 3: Finally, we look at the remainder of the line (after block
       *         markers like >, list markers, and indentation have been consumed).
       *         This is text that can be incorporated into the last open block
       *         (a paragraph, code block, heading, or raw HTML).
       */
      let lastChild: BlockDataNodeMatchState = parent
      while (lastChild.children != null && lastChild.children.length > 0) {
        lastChild = lastChild.children[lastChild.children.length - 1]
      }
      const tokenizer = self.tokenizerMap.get(lastChild.type)
      if (tokenizer != null && tokenizer.eatLazyContinuationText != null) {
        const [nextIndex, success] = tokenizer.eatLazyContinuationText(
          codePoints, i, lineEndIndex, isBlankLine(), lastChild)
        if (success) {
          moveToNext(nextIndex)
        }
      }

      // fallback
      if (self.fallbackTokenizer != null && i < lineEndIndex && lastChild.children != null) {
        const [, state] = self.fallbackTokenizer.eatMarker(
          codePoints, i, lineEndIndex, isBlankLine(), lastChild)
        if (state != null) {
          lastChild.children.push(state)
        }
      }
    }

    return root.children!
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    matchResults?: BlockDataNodeMatchResult[],
  ): BlockDataNode[] {
    const self = this
    if (matchResults == null) {
      // eslint-disable-next-line no-param-reassign
      matchResults = self.match(codePoints, startIndex, endIndex)
    }
    return self.deepParse(codePoints, matchResults)
  }

  protected deepParse(
    codePoints: DataNodeTokenPointDetail[],
    matchResults: BlockDataNodeMatchResult[],
  ): BlockDataNode[] {
    const self = this
    const results: BlockDataNode[] = []
    for (const mr of matchResults) {
      const tokenizer = self.tokenizerMap.get(mr.type)
      if (tokenizer == null) {
        throw new TypeError(`unknown matched result: ${ JSON.stringify(mr) }`)
      }

      let children: BlockDataNode[] | undefined
      if (mr.children != null) {
        children = self.deepParse(codePoints, mr.children)
      }
      const result = tokenizer.parse(codePoints, mr, children, self.inlineDataNodeParseFunc)
      results.push(result)
    }
    return results
  }


  /**
   * 递归关闭数据节点
   * @param parentMatchState
   */
  protected recursivelyCloseState(parentMatchState: BlockDataNodeMatchState): void {
    const self = this
    if (parentMatchState.children == null || parentMatchState.children.length <= 0) return
    for (let state = parentMatchState.children[parentMatchState.children.length - 1]; state.opening;) {
      const tokenizer = self.tokenizerMap.get(state.type)
      if (tokenizer == null) break
      if (tokenizer.closeMatchState != null) {
        tokenizer.closeMatchState(state)
        state.opening = false
      }
    }
  }

  /**
   *
   * @param tokenizer
   */
  protected registerTokenizer(tokenizer: BlockDataNodeTokenizer) {
    for (const t of tokenizer.recognizedTypes) {
      this.tokenizerMap.set(t, tokenizer)
    }
  }
}
