import { LinkReferenceType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfProcessDelimiterPair,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  eatOptionalWhitespaces,
  resolveLinkLabelAndIdentifier,
} from '@yozora/core-tokenizer'
import type { Delimiter, T, Token } from '../types'

// <opener, both>
export function processDelimiterPairOpenerBoth(
  openerDelimiter: Delimiter,
  closerDelimiter: Delimiter,
  innerTokens: YastInlineToken[],
  nodePoints: ReadonlyArray<NodePoint>,
  api: Readonly<MatchInlinePhaseApi>,
): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
  // like '[foo]['
  if (openerDelimiter.startIndex + 1 < openerDelimiter.endIndex) {
    const labelAndIdentifier = resolveLinkLabelAndIdentifier(
      nodePoints,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
    )

    const children = api.resolveFallbackTokens(
      innerTokens,
      openerDelimiter.startIndex + 1,
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
      startIndex: openerDelimiter.startIndex,
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

  // otherwise, like '['
  {
    // There are no non-blank characters between the opener delimiter
    // and the closer delimiter.
    if (
      eatOptionalWhitespaces(
        nodePoints,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
      ) === closerDelimiter.startIndex
    ) {
      return {
        token: innerTokens,
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

    const token: Token = {
      nodeType: LinkReferenceType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      referenceType: 'full',
      label: closerDelimiter.label!,
      identifier: closerDelimiter.identifier!,
      children: api.resolveFallbackTokens(
        innerTokens,
        openerDelimiter.startIndex + 1,
        closerDelimiter.startIndex,
        nodePoints,
      ),
    }
    return { token, shouldInactivateOlderDelimiters: true }
  }
}

export default processDelimiterPairOpenerBoth
