import type {
  EmphasisItalic,
  EmphasisItalicMatchPhaseState,
  EmphasisItalicPotentialToken,
  EmphasisItalicTokenDelimiter,
  EmphasisItalicType,
} from './italic'
import type {
  EmphasisStrong,
  EmphasisStrongMatchPhaseState,
  EmphasisStrongPotentialToken,
  EmphasisStrongTokenDelimiter,
  EmphasisStrongType,
} from './strong'
export * from './italic'
export * from './strong'


export type Emphasis =
  | EmphasisItalic
  | EmphasisStrong


export type EmphasisType =
  | EmphasisItalicType
  | EmphasisStrongType

export type EmphasisTokenDelimiter =
  | EmphasisItalicTokenDelimiter
  | EmphasisStrongTokenDelimiter


export type EmphasisPotentialToken =
  | EmphasisItalicPotentialToken
  | EmphasisStrongPotentialToken


export type EmphasisMatchPhaseState =
  | EmphasisItalicMatchPhaseState
  | EmphasisStrongMatchPhaseState
