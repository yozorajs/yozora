import type { INodePoint, ISourcePoint } from '@yozora/character'
import { isLineEnding, isSpaceCharacter } from '@yozora/character'
import type { IPhrasingContentLine } from '@yozora/core-tokenizer'
import { calcIndentWidth } from '@yozora/core-tokenizer'

/**
 * Create a generator to produce PhrasingContentLines while consuming NodePoints.
 *
 * @param nodePointsList
 * @returns PhrasingContentLine batches with the source end Point as the completion value.
 */
export function* createPhrasingLineGenerator(
  nodePointsList: Iterable<INodePoint[], ISourcePoint | undefined>,
): Iterable<IPhrasingContentLine[], ISourcePoint | undefined> &
  Iterator<IPhrasingContentLine[], ISourcePoint | undefined> {
  const allNodePoints: INodePoint[] = []
  let startIndex = 0
  let firstNonWhitespaceIndex = 0
  let countOfPrecedeSpaces = 0

  // A for-of loop would discard the scanner's EOF Point.
  const iterator = nodePointsList[Symbol.iterator]()
  let result = iterator.next()
  while (!result.done) {
    const nodePoints = result.value
    const lines: IPhrasingContentLine[] = []
    for (const p of nodePoints) {
      const c = p.codePoint

      // Check if it is still a space in the beginning of a line.
      if (firstNonWhitespaceIndex === allNodePoints.length) {
        if (isSpaceCharacter(c)) {
          countOfPrecedeSpaces += 1
          firstNonWhitespaceIndex += 1
        }
      }

      allNodePoints.push(p)
      if (isLineEnding(c)) {
        // Check if it is a blank line.
        if (firstNonWhitespaceIndex + 1 === allNodePoints.length) {
          firstNonWhitespaceIndex += 1
        }

        const line: IPhrasingContentLine = {
          nodePoints: allNodePoints,
          startIndex,
          endIndex: allNodePoints.length,
          firstNonWhitespaceIndex,
          indentWidth: calcIndentWidth(allNodePoints, startIndex, firstNonWhitespaceIndex),
          countOfPrecedeSpaces,
        }
        lines.push(line)
        startIndex = allNodePoints.length
        firstNonWhitespaceIndex = allNodePoints.length
        countOfPrecedeSpaces = 0
      }
    }
    yield lines
    result = iterator.next()
  }

  // After the iterable dried, there is still has some nodePoints.
  if (startIndex < allNodePoints.length) {
    const line: IPhrasingContentLine = {
      nodePoints: allNodePoints,
      startIndex,
      endIndex: allNodePoints.length,
      firstNonWhitespaceIndex,
      indentWidth: calcIndentWidth(allNodePoints, startIndex, firstNonWhitespaceIndex),
      countOfPrecedeSpaces,
    }
    yield [line]
  }
  return result.value
}
