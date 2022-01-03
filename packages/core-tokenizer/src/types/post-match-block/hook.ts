import type { IYastBlockToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IPostMatchBlockPhaseApi } from './api'

export type IPostMatchBlockHookCreator<IThis extends ITokenizer = ITokenizer> = (
  this: IThis,
  api: IPostMatchBlockPhaseApi,
) => IPostMatchBlockHook

/**
 * Hooks on the post-match-block phase.
 */
export interface IPostMatchBlockHook {
  /**
   * Transform IYastBlockToken list.
   *
   * @param tokens  peers nodes those have a same parent.
   */
  transformMatch(tokens: ReadonlyArray<IYastBlockToken>): IYastBlockToken[]
}
