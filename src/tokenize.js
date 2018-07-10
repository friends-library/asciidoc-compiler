// @flow
import type { Token } from './type';

type Result = [
  number,
  ?Token,
];

const tokenizeChars = (input: string, current: number): Result => {
  const char = input[current];
  switch (char) {
    case '*':
      return [1, { type: 'BOLD', value: '' }];
    case '_':
      return [1, { type: 'ITALIC', value: '' }];
    case '\n':
      return [1, { type: 'NEWLINE', value: '' }];
    case ']':
      return [1, { type: 'FOOTNOTE_END', value: '' }];
    default:
      return [0, null];
  }
}

const not = (result: Result): bool => result[0] === 0;

const tokenizeText = (input: string, current: number): Result => {
  let char = input[current];
  let consumed = 0;
  let value = '';
  while (char && not(tokenizeChars(char, 0)) && not(tokenizePatterns(input, current + consumed))) {
    value += char;
    consumed++;
    char = input[current + consumed];
  }
  if (consumed > 0) {
    return [consumed, { type: 'TEXT', value: value }];
  }
  return [0, null];
}

const PATTERNS = {
  'FOOTNOTE_START': /^footnote:\[/,
  'DOUBLE_NEWLINE': /^\n(\n|¶)+/,
  'BLOCKQUOTE_END': /^\n(____*|"")/,
};

const tokenizePatterns = (input: string, current: number): Result => {
  const rest = input.substr(current);
  const types = Object.keys(PATTERNS);

  return types.reduce((token, type) => {
    if (token[1]) return token;
    const pattern = PATTERNS[type];
    const match = rest.match(pattern);
    if (match) {
      return [match[0].length, { type, value: '' }];
    }
    return token;
  }, [0, null]);
}

const tokenizeFootnoteStart = (input: string, current: number): Result => {
  const peek = input.substr(current, current + 10);
  if (peek === 'footnote:[') {
    return [10, { type: 'FOOTNOTE_START', value: peek }];
  }
  return [0, null];
}


const tokenizeHeadings = (input: string, current: number): Result => {
  let char = input[current];
  if (char !== '=') {
    return [0, null];
  }
  let value = char;
  let consumed = 1;
  char = input[current + consumed];

  while (char === '=' || char === ' ') {
    consumed++;
    value += char;
    char = input[current + consumed];
  }

  return [consumed, { type: 'HEADING', value: value.trim() }];
}

const tokenizeQuoteStarts = (input: string, current: number): Result => {
  const peek = input.substr(current);
  const match = peek.match(/^(?:\[quote, (?:([^\]]+)\]\n)?)?(?:____*|"")\n/);
  if (!match) {
    return [0, null];
  }
  return [match[0].length, { type: 'BLOCKQUOTE_START', value: match[1] || '' }];
}

// order matters
const tokenizers = [
  tokenizeQuoteStarts,
  tokenizePatterns,
  tokenizeChars,
  tokenizeHeadings,
  tokenizeText,
];

export default function tokenize(input: string): Array<Token> {
  input = input.trim();
  let current = 0;
  let tokens = [{ type: 'START_OF_FILE', value: '' }];
  while (current < input.length) {
    let tokenized = false;
    tokenizers.forEach(tokenizerFn => {
      if (tokenized) {
        return;
      }
      let [consumed, token] = tokenizerFn(input, current);
      if (consumed !== 0) {
        tokenized = true;
        current += consumed;
      }
      if (token) {
        tokens.push(token);
      }
    });
    if (!tokenized) {
      throw new TypeError('I dont know what this character is: ' + input[current]);
    }
  }
  return tokens;
}
