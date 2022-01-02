import type { IYastBlockToken } from '../token'
import type { IPostMatchBlockPhaseApi } from './api'

export type IPostMatchBlockHookCreator = (
  getApi: () => IPostMatchBlockPhaseApi,
) => IPostMatchBlockHook

/**
 * Hooks on the post-match-block phase.
 */
export interface IPostMatchBlockHook {
  /**
   * Transform IYastBlockToken list.
   *
   * @param tokens  peers nodes those have a same parent.
   * @param api
   */
  transformMatch(
    tokens: ReadonlyArray<IYastBlockToken>,
    api: Readonly<IPostMatchBlockPhaseApi>,
  ): IYastBlockToken[]
}