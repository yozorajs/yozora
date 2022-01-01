import type { IRoot, IYastNode, IYastResource, YastNodeType } from '@yozora/ast'
import { DefinitionType, ImageType, LinkType } from '@yozora/ast'
import { traverseAst } from './ast/traverse'
import type { NodeMatcher } from './ast/util'

/**
 * Resolve url.
 */
export type UrlResolver = (
  ...pathPieces: Array<string | null | undefined>
) => string

/**
 * Join url path with `prefix` and normalize the result.
 *
 * @param prefix
 * @param path
 * @returns
 */
export const defaultUrlResolver: UrlResolver = (...pathPieces): string => {
  const pieces: string[] = pathPieces.filter(
    (x): x is string => typeof x === 'string' && x.length > 0,
  )
  if (pieces.length <= 0) return ''

  // If the last path piece is a absolute url path, then return it directly,
  // otherwise, resolved it with previous url paths.
  const lastPiece = pieces[pieces.length - 1]
  return /^([/]|\w+:[/]{2})/.test(lastPiece)
    ? lastPiece
    : pieces
        .join('/')
        .replace(/[/]+/g, '/')
        .replace(/[/][.][/]/g, '/')
        .trim()
}

/**
 * Traverse yozora ast and resolve urls for aim nodes.
 * @param ast
 * @param aimTypes
 * @param resolveUrl
 */
export function resolveUrlsForAst(
  ast: IRoot,
  aimTypes: ReadonlyArray<YastNodeType> | NodeMatcher = [
    DefinitionType,
    LinkType,
    ImageType,
  ],
  resolveUrl: UrlResolver = defaultUrlResolver,
): void {
  traverseAst(ast, aimTypes, (node): void => {
    const o = node as IYastNode & IYastResource
    if (o.url != null) o.url = resolveUrl(o.url)
  })
}
