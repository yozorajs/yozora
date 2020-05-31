import {
  ItalicEmphasisDataNode,
  ItalicEmphasisMatchPhaseState,
  ItalicEmphasisPotentialToken,
  ItalicEmphasisPreMatchPhaseState,
  ItalicEmphasisTokenDelimiter,
} from './italic'
import {
  StrongEmphasisDataNode,
  StrongEmphasisMatchPhaseState,
  StrongEmphasisPotentialToken,
  StrongEmphasisPreMatchPhaseState,
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


export type EmphasisPreMatchPhaseState =
  | ItalicEmphasisPreMatchPhaseState
  | StrongEmphasisPreMatchPhaseState


export type EmphasisMatchPhaseState =
  | ItalicEmphasisMatchPhaseState
  | StrongEmphasisMatchPhaseState
