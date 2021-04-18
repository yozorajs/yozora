/**
 * Commonly used tokenizer priority enumeration.
 */
export enum TokenizerPriority {
  /**
   * Priority of tokenizers which producing atomic tokens (both blocks and inlines).
   */
  ATOMIC = 10,
  /**
   * Priority of tokenizers which producing fenced block token.
   */
  FENCED_BLOCK = 10,
  /**
   * Priority of tokenizers which producing containing block tokens,
   * such as BlockquoteTokenizer, ListItemTokenizer and etc.
   */
  CONTAINING_BLOCK = 10,
  /**
   * Priority of tokenizers which producing interrupted block tokens,
   * such as TableTokenizer and etc.
   */
  INTERRUPTABLE_BLOCK = 2,
  /**
   * Priority of tokenizers which producing link or image tokens,
   * such as ImageTokenizer, LinkReferenceTokenizer and etc.
   */
  LINKS = 3,
  /**
   * Priority of tokenizers which producing containing block tokens,
   * such as DeleteTokenizer, EmphasisTokenizer and etc.
   */
  CONTAINING_INLINE = 2,
  /**
   * Priority of  block / inline fallback tokenizer.
   */
  FALLBACK = -1,
}
