import { LinkReferenceType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfProcessDelimiterPair,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import { resolveLinkLabelAndIdentifier } from '@yozora/core-tokenizer'
import type { Delimiter, T, Token } from '../types'

// <both, both>
export function processDelimiterPairBothBoth(
  openerDelimiter: Delimiter,
  closerDelimiter: Delimiter,
  innerTokens: YastInlineToken[],
  nodePoints: ReadonlyArray<NodePoint>,
  api: Readonly<MatchInlinePhaseApi>,
): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
  const labelAndIdentifier = resolveLinkLabelAndIdentifier(
    nodePoints,
    openerDelimiter.endIndex,
    closerDelimiter.startIndex,
  )

  const children = api.resolveFallbackTokens(
    innerTokens,
    openerDelimiter.startIndex + 2,
    openerDelimiter.endIndex - 2,
    nodePoints,
  )

  let referenceType: 'full' | 'collapsed' | 'shortcut'
  let endIndex: number
  if (labelAndIdentifier == null) {
    referenceType = 'collapsed'
    endIndex = closerDelimiter.startIndex + 1
  } else if (!api.hasDefinition(labelAndIdentifier.identifier)) {
    referenceType = 'shortcut'
    endIndex = openerDelimiter.endIndex
  } else {
    referenceType = 'full'
    endIndex = closerDelimiter.startIndex + 1
  }

  const { label, identifier } =
    referenceType === 'full' ? labelAndIdentifier! : openerDelimiter
  const token: Token = {
    nodeType: LinkReferenceType,
    startIndex: openerDelimiter.startIndex + 1,
    endIndex,
    referenceType,
    label: label!,
    identifier: identifier!,
    children,
  }

  return {
    token,
    shouldInactivateOlderDelimiters: true,
    remainCloserDelimiter: {
      type: 'opener',
      startIndex: closerDelimiter.startIndex + 1,
      endIndex: closerDelimiter.endIndex,
      identifier: closerDelimiter.identifier,
      label: closerDelimiter.label,
    },
  }
}

export default processDelimiterPairBothBoth
