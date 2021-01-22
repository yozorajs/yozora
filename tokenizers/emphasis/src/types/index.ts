import type {
  EmphasisItalic,
  EmphasisItalicMatchPhaseState,
  EmphasisItalicMatchPhaseStateData,
  EmphasisItalicPostMatchPhaseState,
  EmphasisItalicTokenDelimiter,
  EmphasisItalicType,
} from './italic'
import type {
  EmphasisStrong,
  EmphasisStrongMatchPhaseState,
  EmphasisStrongMatchPhaseStateData,
  EmphasisStrongPostMatchPhaseState,
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


export type EmphasisPostMatchPhaseState =
  | EmphasisItalicPostMatchPhaseState
  | EmphasisStrongPostMatchPhaseState


export type EmphasisMatchPhaseState =
  | EmphasisItalicMatchPhaseState
  | EmphasisStrongMatchPhaseState


export type EmphasisMatchPhaseStateData =
  | EmphasisItalicMatchPhaseStateData
  | EmphasisStrongMatchPhaseStateData
