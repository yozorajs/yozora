import {
  ItalicEmphasisDataNode,
  ItalicEmphasisMatchPhaseState,
  ItalicEmphasisPreMatchPhaseState,
} from './italic'
import {
  StrongEmphasisDataNode,
  StrongEmphasisMatchPhaseState,
  StrongEmphasisPreMatchPhaseState,
} from './strong'
export * from './italic'
export * from './strong'


export type EmphasisDataNode =
  | ItalicEmphasisDataNode
  | StrongEmphasisDataNode


export type EmphasisPreMatchPhaseState =
  | ItalicEmphasisPreMatchPhaseState
  | StrongEmphasisPreMatchPhaseState


export type EmphasisMatchPhaseState =
  | ItalicEmphasisMatchPhaseState
  | StrongEmphasisMatchPhaseState
