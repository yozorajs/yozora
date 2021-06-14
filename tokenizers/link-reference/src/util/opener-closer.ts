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

// <opener, closer>
export function processDelimiterPairOpenerCloser(
  openerDelimiter: Delimiter,
  closerDelimiter: Delimiter,
  innerTokens: YastInlineToken[],
  nodePoints: ReadonlyArray<NodePoint>,
  api: Readonly<MatchInlinePhaseApi>,
): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
  // opener delimiter is '['
  if (openerDelimiter.startIndex + 1 === openerDelimiter.endIndex) {
    // closer delimiter is something like '][bar]'
    if (closerDelimiter.identifier != null) {
      const isBlank: boolean =
        eatOptionalWhitespaces(
          nodePoints,
          openerDelimiter.endIndex,
          closerDelimiter.startIndex,
        ) === closerDelimiter.startIndex

      const token: Token = isBlank
        ? {
            nodeType: LinkReferenceType,
            startIndex: closerDelimiter.startIndex + 1,
            endIndex: closerDelimiter.endIndex,
            referenceType: 'shortcut',
            identifier: closerDelimiter.identifier!,
            label: closerDelimiter.label!,
            children: api.resolveFallbackTokens(
              innerTokens,
              closerDelimiter.startIndex + 2,
              closerDelimiter.endIndex - 1,
              nodePoints,
            ),
          }
        : {
            nodeType: LinkReferenceType,
            startIndex: openerDelimiter.startIndex,
            endIndex: closerDelimiter.endIndex,
            referenceType: 'full',
            identifier: closerDelimiter.identifier!,
            label: closerDelimiter.label!,
            children: api.resolveFallbackTokens(
              innerTokens,
              openerDelimiter.endIndex,
              closerDelimiter.startIndex,
              nodePoints,
            ),
          }
      return { token, shouldInactivateOlderDelimiters: true }
    }

    const labelAndIdentifier = resolveLinkLabelAndIdentifier(
      nodePoints,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
    )
    if (labelAndIdentifier == null) return { token: innerTokens }

    const { label, identifier } = labelAndIdentifier
    if (!api.hasDefinition(identifier)) return { token: innerTokens }

    const token: Token = {
      nodeType: LinkReferenceType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      referenceType:
        closerDelimiter.startIndex + 1 === closerDelimiter.endIndex
          ? 'shortcut'
          : 'collapsed',
      identifier,
      label,
      children: api.resolveFallbackTokens(
        innerTokens,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
        nodePoints,
      ),
    }
    return { token, shouldInactivateOlderDelimiters: true }
  }

  // Otherwise, opener delimiter is something like '[foo]['
  {
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
    const tokens: Token[] = [
      {
        nodeType: LinkReferenceType,
        startIndex: openerDelimiter.startIndex,
        endIndex,
        referenceType,
        label: label!,
        identifier: identifier!,
        children,
      },
    ]

    // resolve the remaining of the closer delimiter like '][bar]'
    if (closerDelimiter.identifier != null) {
      tokens.push({
        nodeType: LinkReferenceType,
        startIndex: closerDelimiter.startIndex + 1,
        endIndex: closerDelimiter.endIndex,
        referenceType: 'shortcut',
        identifier: closerDelimiter.identifier!,
        label: closerDelimiter.label!,
        children: api.resolveFallbackTokens(
          innerTokens,
          closerDelimiter.startIndex + 2,
          closerDelimiter.endIndex - 1,
          nodePoints,
        ),
      })
    }
    return { token: tokens, shouldInactivateOlderDelimiters: true }
  }
}

export default processDelimiterPairOpenerCloser
