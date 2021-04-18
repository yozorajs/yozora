import type { YastParent } from '../ast'
import type { Definition } from './definition'
import type { FootnoteDefinition } from './footnote-definition'

export const RootType = 'root'
export type RootType = typeof RootType

/**
 * Definition meta data.
 */
export type DefinitionMetaData = Pick<
  Definition,
  'identifier' | 'label' | 'title' | 'url'
>

/**
 * Footnote definition meta data.
 */
export type FootnoteDefinitionMetaData = Pick<
  FootnoteDefinition,
  'identifier' | 'label'
>

/**
 * Meta data of the AST.
 */
export interface RootMeta {
  /**
   * Resource definition map.
   */
  definitions: Record<string, DefinitionMetaData>
  /**
   * Footnote definition map.
   */
  footnoteDefinitions: Record<string, FootnoteDefinitionMetaData>
  /**
   * Additional data.
   */
  [key: string]: unknown
}

/**
 * Root node of the AST.
 * @see https://github.com/syntax-tree/unist#root
 */
export interface Root<Meta extends RootMeta = RootMeta>
  extends YastParent<RootType> {
  /**
   * Meta data.
   */
  meta: Meta
}
