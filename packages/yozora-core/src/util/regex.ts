/**
 * Append flags to the given regular expression and return the newly created regular expression
 *
 * @param regex the given regular expression
 * @param flags appended flags to regular expression
 */
export function extendRegExp(regex: RegExp, flags = ''): RegExp {
  const resolvedFlags = (regex.flags + flags).split('')
    .reduce((acc, c) => acc.indexOf(c) < 0 ? acc + c : acc)
  return new RegExp(regex, resolvedFlags)
}
