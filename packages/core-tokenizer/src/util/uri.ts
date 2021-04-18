import { foldCase } from '@yozora/character'

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
