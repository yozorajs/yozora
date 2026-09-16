import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isAlphanumeric } from '@yozora/character'
import type { IResultOfRequiredEater } from '@yozora/tokenizer'
import { eatExtendEmailAddress } from './email'

export interface IResultOfExtendedProtocolEater extends IResultOfRequiredEater {
  recognized: boolean
}

const protocols = [
  { prefix: 'mailto:', allowsResource: false },
  { prefix: 'xmpp:', allowsResource: true },
]

const hasPrefix = (
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
  prefix: string,
): boolean => {
  if (startIndex + prefix.length > endIndex) return false
  for (let index = 0; index < prefix.length; ++index) {
    if (nodePoints[startIndex + index].codePoint !== prefix.charCodeAt(index)) return false
  }
  return true
}

/**
 * Extended protocol autolinks reuse extended-email rules for `mailto:` and
 * `xmpp:`. XMPP additionally allows one slash followed by an alphanumeric,
 * `@`, or `.` resource.
 *
 * @see https://github.github.com/gfm/#extended-protocol-autolink
 */
export function eatExtendedProtocolAutolink(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): IResultOfExtendedProtocolEater {
  const protocol = protocols.find(item => hasPrefix(nodePoints, startIndex, endIndex, item.prefix))
  if (protocol == null) return { recognized: false, valid: false, nextIndex: startIndex + 1 }

  const addressStartIndex = startIndex + protocol.prefix.length
  const email = eatExtendEmailAddress(nodePoints, addressStartIndex, endIndex)
  if (!email.valid) {
    return {
      recognized: true,
      valid: false,
      nextIndex: Math.min(endIndex, Math.max(addressStartIndex, email.nextIndex)),
    }
  }

  let nextIndex = email.nextIndex
  if (
    protocol.allowsResource &&
    nextIndex < endIndex &&
    nodePoints[nextIndex].codePoint === AsciiCodePoint.SLASH
  ) {
    let resourceEndIndex = nextIndex + 1
    for (; resourceEndIndex < endIndex; ++resourceEndIndex) {
      const codePoint = nodePoints[resourceEndIndex].codePoint
      if (
        !isAlphanumeric(codePoint) &&
        codePoint !== AsciiCodePoint.AT_SIGN &&
        codePoint !== AsciiCodePoint.DOT
      ) {
        break
      }
    }
    if (resourceEndIndex > nextIndex + 1) nextIndex = resourceEndIndex
  }
  return { recognized: true, valid: true, nextIndex }
}
