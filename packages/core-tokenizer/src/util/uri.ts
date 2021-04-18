import type { NodePoint } from '@yozora/character'
import { calcStringFromNodePoints, foldCase } from '@yozora/character'

/**
 * Encode link url.
 * @param destination
 */
export function encodeLinkDestination(destination: string): string {
  const uri = decodeURI(destination)
  const result = encodeURI(uri)
  return result
}

/**
 * One label matches another just in case their normalized forms are equal.
 * To normalize a label, strip off the opening and closing brackets, perform
 * the Unicode case fold, strip leading and trailing whitespace and collapse
 * consecutive internal whitespace to a single space. If there are multiple
 * matching reference link definitions, the one that comes first in the
 * document is used. (It is desirable in such cases to emit a warning.)
 * @see https://github.github.com/gfm/#link-label
 */
export function resolveLabelToIdentifier(label: string): string {
  const identifier = label.trim().replace(/\s+/gu, ' ').toLowerCase()
  return foldCase(identifier)
}

/**
 * Resolve a link label and link definition identifier.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#link-label
 */
export function resolveLinkLabelAndIdentifier(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): { label: string; identifier: string } | null {
  const label = calcStringFromNodePoints(nodePoints, startIndex, endIndex, true)

  /**
   * A link label must contain at least one non-whitespace character
   * @see https://github.github.com/gfm/#example-559
   * @see https://github.github.com/gfm/#example-560
   */
  if (label.length <= 0) return null

  const identifier = resolveLabelToIdentifier(label)
  if (identifier == null) return null

  return { label, identifier }
}
