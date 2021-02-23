import type { CodePoint } from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  YastNodeType,
} from '@yozora/tokenizercore'
import type {
  Heading as Node,
  HeadingState as State,
  HeadingType as T,
} from './types'
import {
  AsciiCodePoint,
  calcTrimBoundaryOfCodePoints,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
import {
  PhrasingContentType,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import { HeadingType } from './types'


/**
 * Params for constructing HeadingTokenizer
 */
export interface HeadingTokenizerProps {
  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for Heading.
 *
 * An ATX heading consists of a string of characters, parsed as inline content,
 * between an opening sequence of 1–6 unescaped '#' characters and an optional
 * closing sequence of any number of unescaped '#' characters. The opening
 * sequence of '#' characters must be followed by a space or by the end of line.
 * The optional closing sequence of #s must be preceded by a space and may be
 * followed by spaces only. The opening # character may be indented 0-3 spaces.
 * The raw contents of the heading are stripped of leading and trailing spaces
 * before being parsed as inline content. The heading level is equal to the
 * number of '#' characters in the opening sequence.
 *
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export class HeadingTokenizer implements
  Tokenizer<T>,
  TokenizerMatchBlockHook<T, State>,
  TokenizerParseBlockHook<T, State, Node>
{
  public readonly name: string = 'HeadingTokenizer'
  public readonly recognizedTypes: ReadonlyArray<T> = [HeadingType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>

  /* istanbul ignore next */
  public constructor(props: HeadingTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(line: Readonly<PhrasingContentLine>): ResultOfEatOpener<T, State> {
    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-39
     * @see https://github.github.com/gfm/#example-40
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.NUMBER_SIGN
    ) return null

    let depth = 1, i = firstNonWhitespaceIndex + 1
    for (; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      if (c !== AsciiCodePoint.NUMBER_SIGN) break
      depth += 1
    }

    /**
     * More than six '#' characters is not a heading
     * @see https://github.github.com/gfm/#example-33
     */
    if (depth > 6) return null

    /**
     * At least one space is required between the '#' characters and the
     * heading’s contents, unless the heading is empty. Note that many
     * implementations currently do not require the space. However, the space
     * was required by the original ATX implementation, and it helps prevent
     * things like the following from being parsed as headings:
     *
     * ATX headings can be empty
     * @see https://github.github.com/gfm/#example-49
     */
    if (
      i + 1 < endIndex &&
      !isSpaceCharacter(nodePoints[i].codePoint)
    ) return null

    const nextIndex = endIndex
    const state: State = {
      type: HeadingType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      depth,
      line: { ...line },
    }
    return { state, nextIndex, saturated: true }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parse(state: Readonly<State>): ResultOfParse<Node> {
    const { nodePoints, firstNonWhitespaceIndex, endIndex } = state.line

    /**
     * Leading and trailing whitespace is ignored in parsing inline content
     * Spaces are allowed after the closing sequence
     * @see https://github.github.com/gfm/#example-37
     * @see https://github.github.com/gfm/#example-43
     */
    // eslint-disable-next-line prefer-const
    let [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(
      nodePoints, firstNonWhitespaceIndex + state.depth, endIndex)

    /**
     * A closing sequence of '#' characters is optional
     * It need not be the same length as the opening sequence
     * @see https://github.github.com/gfm/#example-41
     * @see https://github.github.com/gfm/#example-42
     * @see https://github.github.com/gfm/#example-44
     */
    let closeCharCount = 0, c: CodePoint
    for (let j = rightIndex - 1; j >= leftIndex; --j) {
      c = nodePoints[j].codePoint
      if (c !== AsciiCodePoint.NUMBER_SIGN) break
      closeCharCount += 1
    }
    if (closeCharCount > 0) {
      let spaceCount = 0, j = rightIndex - 1 - closeCharCount
      for (; j >= leftIndex; --j) {
        c = nodePoints[j].codePoint
        if (!isWhitespaceCharacter(c)) break
        spaceCount += 1
      }
      if (spaceCount > 0 || j < leftIndex) {
        rightIndex -= closeCharCount + spaceCount
      }
    }

    const node: Node = {
      type: state.type,
      depth: state.depth,
      children: [],
    }

    // Resolve phrasing content.
    const lines: PhrasingContentLine[] = [{
      nodePoints,
      startIndex: leftIndex,
      endIndex: rightIndex,
      firstNonWhitespaceIndex: leftIndex,
      countOfPrecedeSpaces: 0,
    }]
    const context = this.getContext()!
    const phrasingContentState = context.buildPhrasingContentState(lines)
    if (phrasingContentState != null) {
      const phrasingContent = context.buildPhrasingContent(phrasingContentState)
      if (phrasingContent != null) {
        node.children.push(phrasingContent)
      }
    }

    return { classification: 'flow', node }
  }
}
