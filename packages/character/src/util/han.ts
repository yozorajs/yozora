/**
 * Remove line end between two chinese characters.
 * @see https://stackoverflow.com/a/21113538/14797950
 * @see https://stackoverflow.com/a/61151122/14797950
 */
export const stripChineseCharacters: (value: string) => string = (() => {
  try {
    const pattern =
      /\p{Script=Han}|[\u{3002}\u{ff1f}\u{ff01}\u{ff0c}\u{3001}\u{ff1b}\u{ff1a}\u{201c}\u{201d}\u{2018}\u{2019}\u{ff08}\u{ff09}\u{300a}\u{300b}\u{3008}\u{3009}\u{3010}\u{3011}\u{300e}\u{300f}\u{300c}\u{300d}\u{fe43}\u{fe44}\u{3014}\u{3015}\u{2026}\u{2014}\u{ff5e}\u{fe4f}\u{ffe5}]/u
        .source
    const regex = new RegExp(`(${pattern})\\s*\\n\\s*(${pattern})`, 'gu')
    return (value: string): string => value.replace(regex, '$1$2')
  } catch {
    const pattern =
      /[\u{4E00}-\u{9FCC}\u{3400}-\u{4DB5}\u{FA0E}\u{FA0F}\u{FA11}\u{FA13}\u{FA14}\u{FA1F}\u{FA21}\u{FA23}\u{FA24}\u{FA27}-\u{FA29}]|[\u{d840}-\u{d868}][\u{dc00}-\u{dfff}]|\u{d869}[\u{dc00}-\u{ded6}\u{df00}-\u{dfff}]|[\u{d86a}-\u{d86c}][\u{dc00}-\u{dfff}]|\u{d86d}[\u{dc00}-\u{df34}\u{df40}-\u{dfff}]|\u{d86e}[\u{dc00}-\u{dc1d}]/u
        .source
    const regex = new RegExp(`(${pattern})\\s*\\n\\s*(${pattern})`, 'gu')
    return (value: string): string => value.replace(regex, '$1$2')
  }
})()
