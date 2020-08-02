import {
  ItalicEmphasisDataNode,
  ItalicEmphasisMatchPhaseState,
  ItalicEmphasisPotentialToken,
  ItalicEmphasisTokenDelimiter,
} from './italic'
import {
  StrongEmphasisDataNode,
  StrongEmphasisMatchPhaseState,
  StrongEmphasisPotentialToken,
  StrongEmphasisTokenDelimiter,
} from './strong'
export * from './italic'
export * from './strong'


export type EmphasisDataNode =
  | ItalicEmphasisDataNode
  | StrongEmphasisDataNode


export type EmphasisTokenDelimiter =
  | ItalicEmphasisTokenDelimiter
  | StrongEmphasisTokenDelimiter


export type EmphasisPotentialToken =
  | ItalicEmphasisPotentialToken
  | StrongEmphasisPotentialToken


export type EmphasisMatchPhaseState =
  | ItalicEmphasisMatchPhaseState
  | StrongEmphasisMatchPhaseState
