import type { Node, NodeType, Parent } from '@yozora/ast'
import {
  BreakType,
  DeleteType,
  EmphasisType,
  FootnoteReferenceType,
  FootnoteType,
  ImageReferenceType,
  ImageType,
  InlineCodeType,
  InlineMathType,
  LinkReferenceType,
  LinkType,
  StrongType,
  TextType,
} from '@yozora/ast'
import type { INodeMatcher } from './misc'
import { collectNodes } from './node'

const inlineNodeTypes = new Set<NodeType>([
  BreakType,
  DeleteType,
  EmphasisType,
  FootnoteReferenceType,
  FootnoteType,
  ImageReferenceType,
  ImageType,
  InlineCodeType,
  InlineMathType,
  LinkReferenceType,
  LinkType,
  StrongType,
  TextType,
])

export const inlineNodeMatcher: INodeMatcher = node => inlineNodeTypes.has(node.type)

export function collectInlineNodes<T extends NodeType, O extends Node<T>>(
  root: Readonly<Parent>,
): O[] {
  return collectNodes(root, inlineNodeMatcher)
}
