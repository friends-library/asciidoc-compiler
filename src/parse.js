// @flow
import type { Token, TokenType, Node } from './type';

type ParseResult = [
  number,
  Node,
];

function parseInline(
  tokens: Array<Token>,
  current: number,
  nodeType: string,
  tokenType: TokenType
): ParseResult {
  let token = tokens[++current]; // skip past opening token

  let node = {
    type: nodeType,
    children: [],
  };

  let child;
  while (token && token.type !== tokenType) {
    [current, child] = parseToken(tokens, current);
    node.children.push(child);
    token = tokens[current];
  }
  current++; // skip past closing token

  return [current, node];
}

function parseBlocklike(
  tokens: Array<Token>,
  current: number,
  nodeType: string,
  stop: TokenType
): ParseResult {
  let token = tokens[current];

  let block = {
    type: nodeType,
    children: [],
  };

  let child;
  while (token && token.type !== stop) {
    [current, child] = maybeWrapParagraph(tokens, current);
    block.children.push(child);
    token = tokens[current];
  }
  current++; // skip past closing token

  return [current, block];
}

function parseFootnote(tokens, current): ParseResult {
  return parseBlocklike(tokens, current, 'Footnote', 'FOOTNOTE_END');
}

function trimQuotish(input: string): string {
  return input.replace(/^"|'/, '').replace(/"|'$/, '');
}

function parseBlockQuote(tokens: Array<Token>, current: number): ParseResult {
  const token = tokens[current];
  const [index, node] = parseBlocklike(tokens, current, 'Blockquote', 'BLOCKQUOTE_END');
  if (!token.value) {
    return [index, node];
  }

  let author;
  let source;
  const firstChar = token.value[0];
  if (firstChar === '"') {
    [author, source] = token.value.split(/", /);
  } else if (firstChar === "'") {
    [author, source] = token.value.split(/', /);
  } else if (firstChar === ',') {
    source = token.value.replace(/^, /, '').trim();
  } else if (token.value.indexOf(',') === -1) {
    author = token.value;
  } else {
    const index = token.value.indexOf(',');
    author = token.value.substr(0, index);
    source = token.value.substr(index + 2);
  }

  node.meta = {
    ...author ? { author: trimQuotish(author) } : {},
    ...source ? { source: trimQuotish(source) } : {},
  };

  return [index, node];

}

function parseItalic(tokens: Array<Token>, current: number): ParseResult {
  return parseInline(tokens, current, 'Italic', 'ITALIC');
}

function parseBold(tokens: Array<Token>, current: number): ParseResult {
  return parseInline(tokens, current, 'Bold', 'BOLD');
}

function parseText(tokens: Array<Token>, current: number): ParseResult {
  let token = tokens[current];
  const result = [current + 1, { type: 'Text', value: token.value, children: [] }];
  return result;
}

function parseNewline(tokens: Array<Token>, current: number): ParseResult {
  return [current + 1, { type: 'Text', value: ' ', children: [] }];
}

function parseUntil(
  stops: Array<TokenType>,
  tokens: Array<Token>,
  current: number,
  parent: Node
): ParseResult {
  current++;
  let token = tokens[current];
  let child;
  while (token && stops.includes(token.type) === false) {
    [current, child] = parseToken(tokens, current);
    parent.children.push(child);
    token = tokens[current];
  }
  return [current, parent];
}

function parseHeading(tokens: Array<Token>, current: number): ParseResult {
  let token = tokens[current];
  const heading = {
    type: `Heading${token.value.length}`,
    children: [],
  };
  return parseUntil(['DOUBLE_NEWLINE'], tokens, current, heading);
}

function maybeWrapParagraph(tokens: Array<Token>, current: number): ParseResult {
  const next = tokens[current + 1];
  if (next && ['TEXT', 'BOLD', 'ITALIC'].includes(next.type)) {
    const para = {
      type: 'Paragraph',
      children: [],
    };
    const stops = ['DOUBLE_NEWLINE', 'FOOTNOTE_END', 'BLOCKQUOTE_END'];
    return parseUntil(stops, tokens, current, para);
  }
  return parseToken(tokens, current + 1);
}


function parseToken(tokens: Array<Token>, current: number): ParseResult {
  let token = tokens[current];
  switch (token.type) {
    case 'START_OF_FILE':
      return maybeWrapParagraph(tokens, current);
    case 'BLOCKQUOTE_START':
      return parseBlockQuote(tokens, current);
    case 'FOOTNOTE_START':
      return parseFootnote(tokens, current);
    case 'BLOCKQUOTE_END':
    case 'FOOTNOTE_END':
      return parseToken(tokens, current + 1);
    case 'HEADING':
      return parseHeading(tokens, current);
    case 'BOLD':
      return parseBold(tokens, current);
    case 'ITALIC':
      return parseItalic(tokens, current);
    case 'TEXT':
      return parseText(tokens, current);
    case 'NEWLINE':
      return parseNewline(tokens, current);
    case 'DOUBLE_NEWLINE':
      return maybeWrapParagraph(tokens, current);
    default:
      console.warn(token);
      throw new Error('No good');
  }
}


export default function parse(tokens: Array<Token>): Node {
  let current = 0;
  let document = {
    type: 'Document',
    children: [],
  };
  let node = null;
  while (current < tokens.length) {
    [current, node] = parseToken(tokens, current);
    document.children.push(node);
  }

  return document;
}
