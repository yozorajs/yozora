import { AsciiCodePoint } from '../constant/ascii'
import { entityReferences } from '../constant/entity'
import { UnicodeCodePoint } from '../constant/unicode/unicode'
import type { CodePoint, NodePoint } from '../types'
import { isAsciiDigitCharacter } from './charset/ascii'

/**
 * Entity references consist of '&' + any of the valid HTML5 entity names + ';'.
 * The document https://html.spec.whatwg.org/multipage/entities.json is used as
 * an authoritative source for the valid entity references and their
 * corresponding code points
 * @see https://github.github.com/gfm/#entity-references
 */
export interface EntityReferences {
  /**
   * The end index of the matched entity reference.
   */
  nextIndex: number
  /**
   * Literal string of the entity reference.
   */
  value: string
}

/**
 * Entity reference trie (the first character '&' is omitted).
 */
export interface EntityReferenceTrie {
  /**
   * Search a valid entity (nodePoints.slice(startIndex,endIndex)) from the
   * trie (the first character '&' is omitted).
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  search: (
    nodePoints: ReadonlyArray<Pick<NodePoint, 'codePoint'>>,
    startIndex: number,
    endIndex: number,
  ) => EntityReferences | null

  /**
   * Insert a entity reference into the trie (the first character '&' is omitted).
   * @param keys
   * @param value
   */
  insert: (keys: CodePoint[], value: string) => void
}

/**
 * Create entity trie.
 */
export function createEntityReferenceTrie(): EntityReferenceTrie {
  interface EntityTrieNode {
    key: CodePoint
    children: EntityTrieNode[]
    value?: string
  }

  /**
   * Find the first index of node which key is greaterOrEqual than the given key.
   * @param nodes   peer nodes of EntityTrie which have a same parent.
   * @param key     a CodePoint identify a peer node
   */
  const upperBound = (nodes: EntityTrieNode[], key: CodePoint): number => {
    // Traversal to retrieve the key for smaller arrays.
    if (nodes.length <= 4) {
      for (let i = 0; i < nodes.length; ++i) {
        if (nodes[i].key >= key) return i
      }
      return nodes.length
    }

    // Using binary search algorithm for larger array..
    let lft = 0,
      rht = nodes.length
    while (lft < rht) {
      const mid = (lft + rht) >>> 1
      const o = nodes[mid]
      if (o.key < key) lft = mid + 1
      else rht = mid
    }
    return lft
  }

  const root: EntityTrieNode = { key: 0, children: [] }

  /**
   * @see EntityReferenceTrie
   */
  const insert = (keys: CodePoint[], value: string): void => {
    let u = root
    for (const key of keys) {
      const index = upperBound(u.children, key)
      if (index >= u.children.length) {
        const v: EntityTrieNode = { key, children: [] }
        u.children.push(v)
        u = v
        continue
      }

      let v = u.children[index]
      if (v.key === key) {
        u = v
        continue
      }

      v = { key, children: [] }
      u.children.splice(index, 0, v)
      u = v
    }
    u.value = value
  }

  /**
   * @see EntityReferenceTrie
   */
  const search = (
    nodePoints: ReadonlyArray<Pick<NodePoint, 'codePoint'>>,
    startIndex: number,
    endIndex: number,
  ): EntityReferences | null => {
    let u = root
    for (let i = startIndex; i < endIndex; ++i) {
      const key = nodePoints[i].codePoint
      const index = upperBound(u.children, key)
      if (index >= u.children.length) return null

      const v = u.children[index]
      if (v.key !== key) return null
      if (v.value != null) return { nextIndex: i + 1, value: v.value }
      u = v
    }
    return null
  }

  return { insert, search }
}

/**
 * Default entity reference trie.
 */
export const entityReferenceTrie = createEntityReferenceTrie()
entityReferences.forEach(entity =>
  entityReferenceTrie.insert(entity.key, entity.value),
)

/**
 * Eating an entity reference.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
export function eatEntityReference(
  nodePoints: ReadonlyArray<Pick<NodePoint, 'codePoint'>>,
  startIndex: number,
  endIndex: number,
): EntityReferences | null {
  if (startIndex + 1 >= endIndex) return null

  const result = entityReferenceTrie.search(nodePoints, startIndex, endIndex)
  if (result != null) return result

  if (nodePoints[startIndex].codePoint !== AsciiCodePoint.NUMBER_SIGN)
    return null

  let val = 0,
    i = startIndex + 1

  if (
    nodePoints[i].codePoint === AsciiCodePoint.LOWERCASE_X ||
    nodePoints[i].codePoint === AsciiCodePoint.UPPERCASE_X
  ) {
    /**
     * Try Hexadecimal numeric character references.
     *
     * Hexadecimal numeric character references consist of '&#' + either 'X' or
     * 'x' + a string of 1-6 hexadecimal digits + ';'. They too are parsed as
     * the corresponding Unicode character (this time specified with a
     * hexadecimal numeral instead of decimal)
     * @see https://github.github.com/gfm/#hexadecimal-numeric-character-references
     */
    i += 1
    for (let cnt = 1; cnt <= 6 && i < endIndex; ++cnt, ++i) {
      const c = nodePoints[i].codePoint
      if (isAsciiDigitCharacter(c)) {
        val = (val << 4) + (c - AsciiCodePoint.DIGIT0)
        continue
      }

      if (c >= AsciiCodePoint.UPPERCASE_A && c <= AsciiCodePoint.UPPERCASE_F) {
        val = (val << 4) + (c - AsciiCodePoint.UPPERCASE_A + 10)
        continue
      }

      if (c >= AsciiCodePoint.LOWERCASE_A && c <= AsciiCodePoint.LOWERCASE_F) {
        val = (val << 4) + (c - AsciiCodePoint.LOWERCASE_A + 10)
        continue
      }
      break
    }
  } else {
    /**
     * Try Decimal numeric character references.
     *
     * Decimal numeric character references consist of '&#' + a string of 1–7
     * arabic digits + ';'. A numeric character reference is parsed as the
     * corresponding Unicode character. Invalid Unicode code points will be
     * replaced by the REPLACEMENT CHARACTER (U+FFFD). For security reasons,
     * the code point U+0000 will also be replaced by U+FFFD.
     * @see https://github.github.com/gfm/#decimal-numeric-character-references
     */
    for (let cnt = 1; cnt <= 7 && i < endIndex; ++cnt, ++i) {
      const c = nodePoints[i].codePoint
      if (!isAsciiDigitCharacter(c)) break
      val = val * 10 + (c - AsciiCodePoint.DIGIT0)
    }
  }

  if (i >= endIndex || nodePoints[i].codePoint !== AsciiCodePoint.SEMICOLON)
    return null

  // Calc the corresponding Unicode character.
  let value: string
  try {
    if (val === 0) val = UnicodeCodePoint.REPLACEMENT_CHARACTER
    value = String.fromCodePoint(val)
  } catch (error) {
    value = String.fromCodePoint(UnicodeCodePoint.REPLACEMENT_CHARACTER)
  }
  return { nextIndex: i + 1, value }
}
