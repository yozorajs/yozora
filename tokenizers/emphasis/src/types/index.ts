import type {
  YastNodeItalicEmphasis,
  ItalicEmphasisMatchPhaseState,
  ItalicEmphasisPotentialToken,
  ItalicEmphasisTokenDelimiter,
} from './italic'
import type {
  YastNodeStrongEmphasis,
  StrongEmphasisMatchPhaseState,
  StrongEmphasisPotentialToken,
  StrongEmphasisTokenDelimiter,
} from './strong'
export * from './italic'
export * from './strong'


export type EmphasisDataNode =
  | YastNodeItalicEmphasis
  | YastNodeStrongEmphasis


export type EmphasisTokenDelimiter =
  | ItalicEmphasisTokenDelimiter
  | StrongEmphasisTokenDelimiter


export type EmphasisPotentialToken =
  | ItalicEmphasisPotentialToken
  | StrongEmphasisPotentialToken


export type EmphasisMatchPhaseState =
  | ItalicEmphasisMatchPhaseState
  | StrongEmphasisMatchPhaseState
