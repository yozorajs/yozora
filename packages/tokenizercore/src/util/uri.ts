/**
 * Encode link url.
 * @param destination
 */
export function encodeLinkDestination(destination: string): string {
  const uri = decodeURI(destination)
  const result = encodeURI(uri)
  return result
}
