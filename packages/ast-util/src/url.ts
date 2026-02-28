import type { Node, NodeType, Resource, Root } from '@yozora/ast'
import type { INodeMatcher } from './ast/collect/misc'
import { traverseAst } from './ast/traverse'

/**
 * Resolve url.
 */
export type IUrlResolver = (...pathPieces: (string | null | undefined)[]) => string

/**
 * Join url path with `prefix` and normalize the result.
 *
 * @param pathPieces
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

const defaultResourceMatcher: INodeMatcher = node => (node as Node & Resource).url != null

/**
 * Traverse yozora ast and resolve urls for aim nodes.
 * @param ast
 * @param aimTypesOrNodeMatcher
 * @param resolveUrl
 */
export const resolveUrlsForAst = (
  ast: Root,
  aimTypesOrNodeMatcher: readonly NodeType[] | INodeMatcher = defaultResourceMatcher,
  resolveUrl: IUrlResolver = defaultUrlResolver,
): void => {
  traverseAst(ast, aimTypesOrNodeMatcher, node => {
    const o = node as Node & Resource
    if (o.url != null) o.url = resolveUrl(o.url)
  })
}
