import type { IYastNode, IYastResource, Root, YastNodeType } from '@yozora/ast'
import { DefinitionType, ImageType, LinkType } from '@yozora/ast'
import { traverseAst } from './ast/traverse'
import type { INodeMatcher } from './ast/util'

/**
 * Resolve url.
 */
export type IUrlResolver = (...pathPieces: Array<string | null | undefined>) => string

/**
 * Join url path with `prefix` and normalize the result.
 *
 * @param prefix
 * @param path
 * @returns
 */
export const defaultUrlResolver: IUrlResolver = (...pathPieces): string => {
  let pieces: string[] = []
  for (const piece of pathPieces) {
    if (typeof piece !== 'string') continue
    const text: string = piece.trim()
    if (text.length > 0) {
      // If a piece is a absolute url path, then dismiss the previous pieces,
      // otherwise, resolved it with previous url paths.
      if (/^([/]|\w+:[/]{2})/.test(text)) pieces = [text]
      else pieces.push(text)
    }
  }

  return pieces
    .join('/')
    .replace(/([^:])[/]+/g, '$1/')
    .replace(/[/][.][/]/g, '/')
    .trim()
}

/**
 * Traverse yozora ast and resolve urls for aim nodes.
 * @param ast
 * @param aimTypes
 * @param resolveUrl
 */
export const resolveUrlsForAst = (
  ast: Root,
  aimTypes: ReadonlyArray<YastNodeType> | INodeMatcher = [DefinitionType, LinkType, ImageType],
  resolveUrl: IUrlResolver = defaultUrlResolver,
): void => {
  traverseAst(ast, aimTypes, node => {
    const o = node as IYastNode & IYastResource
    if (o.url != null) o.url = resolveUrl(o.url)
  })
}
