import type { Position } from '@yozora/ast'

/**
 * Resolve the last source line actually covered by a Position.
 *
 * Positions use an exclusive end point, so a region terminated by a line ending
 * lands on column 1 of the *next* source line. Strip that trailing crossing so
 * line-adjacency checks compare real content lines.
 */
export function calcLastSourceLine(position: Position | undefined): number | undefined {
  if (position == null) return undefined

  const { start, end } = position
  return end.column === 1 && end.line > start.line ? end.line - 1 : end.line
}
