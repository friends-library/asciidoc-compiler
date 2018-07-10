// @flow

export type TokenType = 'TEXT'
 | 'START_OF_FILE'
 | 'BOLD'
 | 'FOOTNOTE_START'
 | 'FOOTNOTE_END'
 | 'NEWLINE'
 | 'ITALIC'
 | 'DOUBLE_NEWLINE'
 | 'BLOCKQUOTE_START'
 | 'BLOCKQUOTE_END'
 | 'HEADING';

export type Token = {|
  type: TokenType,
  value: string,
|};

export type Node = {|
  type: string,
  children: Array<Node>,
  value?: string,
  meta?: Object,
|};
