import type { Node, NodeType, Resource, Root } from '@yozora/ast'
import type { INodeMatcher } from './ast/collect/misc'
import { traverseAst } from './ast/traverse'

const URL_PREFIX_PATTERN = /^(?:(?:[A-Za-z][A-Za-z\d+.-]*:)?[/]{2}[^/]*|[A-Za-z][A-Za-z\d+.-]*:)/
const URL_SUFFIX_DELIMITER_PATTERN = /[?#]/
const OPAQUE_URL_PREFIX_PATTERN = /^(?:data|mailto|urn):$/i

/**
 * Resolve url.
 */
export type IUrlResolver = (...pathPieces: (string | null | undefined)[]) => string

/**
 * Join URL path pieces using directory-base semantics and normalize literal dot segments.
 * Absolute paths and URI schemes replace preceding pieces. Query-only and fragment-only
 * references update the current result without adding a path separator.
 *
 * @param pathPieces
 * @returns
 */
export const defaultUrlResolver: IUrlResolver = (...pathPieces): string => {
  let resolvedPath = ''
  let suffix = ''

  for (const piece of pathPieces) {
    if (typeof piece !== 'string') continue
    const text: string = piece.trim()
    if (text.length <= 0) continue

    const suffixIndex = text.search(URL_SUFFIX_DELIMITER_PATTERN)
    const path = suffixIndex < 0 ? text : text.slice(0, suffixIndex)
    const nextSuffix = suffixIndex < 0 ? '' : text.slice(suffixIndex)
    if (path.length > 0) {
      if (resolvedPath.length <= 0 || path.startsWith('/') || URL_PREFIX_PATTERN.test(path)) {
        resolvedPath = path
      } else {
        resolvedPath += '/' + path
      }
      suffix = nextSuffix
    } else if (nextSuffix.startsWith('?')) {
      suffix = nextSuffix
    } else {
      // A fragment-only reference preserves the current query and replaces the fragment.
      const fragmentIndex = suffix.indexOf('#')
      if (fragmentIndex >= 0) suffix = suffix.slice(0, fragmentIndex)
      suffix += nextSuffix
    }
  }

  return normalizeUrlPath(resolvedPath) + suffix
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

function normalizeUrlPath(path: string): string {
  const prefix = URL_PREFIX_PATTERN.exec(path)?.[0] ?? ''
  const pathname = path.slice(prefix.length)

  if (pathname.length <= 0) return prefix

  // These scheme-specific payloads are not hierarchical paths.
  if (OPAQUE_URL_PREFIX_PATTERN.test(prefix)) return path

  const absolute = pathname.startsWith('/')
  const preserveTrailingSlash =
    pathname.endsWith('/') || pathname.endsWith('/.') || pathname.endsWith('/..')
  const segments: string[] = []
  for (const segment of pathname.split('/')) {
    if (segment.length <= 0 || segment === '.') continue
    if (segment === '..') {
      if (segments.length > 0 && segments[segments.length - 1] !== '..') segments.pop()
      else if (!absolute) segments.push(segment)
    } else {
      segments.push(segment)
    }
  }

  let normalizedPath = (absolute ? '/' : '') + segments.join('/')
  if (preserveTrailingSlash && normalizedPath.length > 0 && !normalizedPath.endsWith('/')) {
    normalizedPath += '/'
  }
  return prefix + normalizedPath
}
