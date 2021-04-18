import { foldingCaseCodeMap } from '../constant/folding-case'

/**
 * Perform unicode case folding.
 * @param text
 * @returns
 */
export function foldCase(text: string): string {
  return Array.from(text)
    .map(c => foldingCaseCodeMap[c] ?? c)
    .join('')
}
