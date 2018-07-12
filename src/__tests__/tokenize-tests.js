import tokenize from '../tokenize';
import { logJson } from '../helpers';

describe('tokenize()', () => {
  it('matches bold text', () => {
    const tokens = tokenize('*foo*');
    expect(tokens.length).toBe(4);
    expect(tokens[0]).toEqual({ type: 'START_OF_FILE', value: '' });
    expect(tokens[1]).toEqual({ type: 'BOLD', value: '' });
    expect(tokens[2]).toEqual({ type: 'TEXT', value: 'foo' });
    expect(tokens[3]).toEqual({ type: 'BOLD', value: '' });
  });

  it('matches newlines differently from double newlines', () => {
    const tokens = tokenize("Foo\n\nBar\nBaz");

    expect(tokens).toEqual([
      { type: 'START_OF_FILE', value: '' },
      { type: 'TEXT', value: 'Foo' },
      { type: 'DOUBLE_NEWLINE', value: ''},
      { type: 'TEXT', value: 'Bar' },
      { type: 'NEWLINE', value: ''},
      { type: 'TEXT', value: 'Baz' },
    ]);
  });

  it('matches h2', () => {
    const tokens = tokenize('==Hello');

    expect(tokens).toEqual([
      { type: 'START_OF_FILE', value: '' },
      { type: 'HEADING', value: '=='},
      { type: 'TEXT', value: 'Hello'},
    ]);
  });

  it('swallows leading spaces from headers', () => {
    const tokens = tokenize('== Hello').slice(1);

    expect(tokens).toEqual([
      { type: 'HEADING', value: '=='},
      { type: 'TEXT', value: 'Hello'},
    ]);
  });

  it('matches italics', () => {
    const [ _, i1, text, i2 ] = tokenize('_Foo_');

    expect(i1).toEqual({ type: 'ITALIC', value: '' });
    expect(i2).toEqual({ type: 'ITALIC', value: '' });
  });

  it('matches footnotes', () => {
    const tokens = tokenize('Lol.footnote:[rofl]');

    expect(tokens[2]).toEqual({ type: 'FOOTNOTE_START', value: '' });
    expect(tokens[3]).toEqual({ type: 'TEXT', value: 'rofl' });
    expect(tokens[4]).toEqual({ type: 'FOOTNOTE_END', value: '' });
  });

  it('understands pilcrows', () => {
    const tokens = tokenize('Foo.\n¶Bar.');

    expect(tokens[2].type).toBe('DOUBLE_NEWLINE');
  });

  test('uncited blockquote', () => {
    const tokens = tokenize('Para.\n\n____\nQuote.\n____').slice(1);

    expect(tokens[2]).toEqual({ type: 'BLOCKQUOTE_START', value: '' });
    expect(tokens[3]).toEqual({ type: 'TEXT', value: 'Quote.' });
    expect(tokens[4]).toEqual({ type: 'BLOCKQUOTE_END', value: '' });
  });

  test('uncited blockquote (airquote style)', () => {
    const tokens = tokenize('Para.\n\n""\nQuote.\n""').slice(1);

    expect(tokens[2]).toEqual({ type: 'BLOCKQUOTE_START', value: '' });
    expect(tokens[3]).toEqual({ type: 'TEXT', value: 'Quote.' });
    expect(tokens[4]).toEqual({ type: 'BLOCKQUOTE_END', value: '' });
  });

  test('cited blockquote', () => {
    const tokens = tokenize('Para.\n\n[quote, JFK]\n____\nQuote.\n____\n\nFoo.').slice(1);

    expect(tokens[2]).toEqual({ type: 'BLOCKQUOTE_START', value: 'JFK' });
    expect(tokens[3]).toEqual({ type: 'TEXT', value: 'Quote.' });
    expect(tokens[4]).toEqual({ type: 'BLOCKQUOTE_END', value: '' });
  });

  test('fully cited blockquote', () => {
    const tokens = tokenize('Para.\n\n[quote, JFK, DC]\n____\nQuote.\n____\n\nFoo.').slice(1);

    expect(tokens[2]).toEqual({ type: 'BLOCKQUOTE_START', value: 'JFK, DC' });
    expect(tokens[3]).toEqual({ type: 'TEXT', value: 'Quote.' });
    expect(tokens[4]).toEqual({ type: 'BLOCKQUOTE_END', value: '' });
  });

  test('blockquotes can have more than four underscores', () => {
    const tokens = tokenize('Para.\n\n________\nQuote.\n________').slice(1);

    expect(tokens[2]).toEqual({ type: 'BLOCKQUOTE_START', value: '' });
    expect(tokens[3]).toEqual({ type: 'TEXT', value: 'Quote.' });
    expect(tokens[4]).toEqual({ type: 'BLOCKQUOTE_END', value: '' });
    expect(tokens).toHaveLength(5);
  });
});
/*
A paragraph, followed by an uncited quote:

____
Ask not what your country can do for you.
____

*/


/*
A paragraph, followed by an cited quote:

[quote, JFK]
____
Ask not what your country can do for you.
____

*/

/*
A paragraph, followed by an cited quote, with location:

[quote, JFK, The White House]
____
Ask not what your country can do for you.
____

*/
