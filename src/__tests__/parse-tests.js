import tokenize from '../tokenize';
import parse from '../parse';
import { logJson } from '../helpers';

const token = (type, value) => ({ type, value });

describe('parse()', () => {
  it('should parse a simple bold word', () => {
    const tokens = tokenize('*foo*');
    const ast = parse(tokens);
    const { children: [ para ] } = ast;

    expect(ast.children).toHaveLength(1);
    expect(para).toEqual({ type: 'Paragraph', children: [
      { type: 'Bold', children: [
        { type: 'Text', value: 'foo', children: [] }
      ]}
    ]});
  });

  it('should parse italics', () => {
    const ast = parse(tokenize('_foo_'));
    const { children: [ para ] } = ast;
    const { children: [ italic ] } = para;

    expect(italic.type).toBe('Italic');
    expect(italic.children).toEqual([
      { type: 'Text', value: 'foo', children: [] },
    ]);
  });

  it('should wrap text nodes in a paragraph node', () => {
    const tokens = tokenize('Foobar');
    const ast = parse(tokens);
    const { children: [ para ] } = ast;

    expect(para.type).toBe('Paragraph');
    expect(para.children).toHaveLength(1);
    expect(para.children[0].type).toBe('Text');
    expect(para.children[0].children).toEqual([]);
  });

  it('should parse newlines within paragraphs to spaces', () => {
    const tokens = tokenize('Foo\nbar.');
    const { children: [ para ] } = parse(tokens);
    const { children: [ t1, t2, t3 ] } = para;

    expect(t1.value).toBe('Foo');
    expect(t2.value).toBe(' ');
    expect(t3.value).toBe('bar.');
  });

  it('should parse a heading', () => {
    const ast = parse(tokenize('=Foo *bar*'));
    const { children: [ heading ] } = ast;
    const { children: [ t1, bold ] } = heading;
    const { children: [ t2 ] } = bold;

    expect(heading.type).toBe('Heading1');
    expect(t1).toEqual({ type: 'Text', value: 'Foo ', children: [] });
    expect(bold.type).toBe('Bold');
    expect(t2).toEqual({ type: 'Text', value: 'bar', children: [] });
  });

  it('should parse this', () => {
    const text = '==My heading with *bold.*\n\nA paragraph';
    const tokens = tokenize(text);
    const ast = parse(tokens);

    expect(ast.children[1].type).toBe('Paragraph');
  });

  test('parses footnotes', () => {
    const tokens = tokenize('Foo.footnote:[bar]');
    const ast = parse(tokens);
    const { children: [ para ] } = ast;
    const { children: [ t1, footnote ] } = para;

    expect(footnote.type).toBe('Footnote');
    expect(footnote.children).toHaveLength(1);
    expect(footnote.children[0].type).toBe('Paragraph');
    expect(footnote.children[0].children).toHaveLength(1);
    expect(footnote.children[0].children[0].type).toBe('Text');
    expect(footnote.children[0].children[0].value).toBe('bar');
  });

  test('can parse multi-paragraph footnotes', () => {
    const tokens = tokenize('Foo.footnote:[Hello.\n¶Sir.]');
    const ast = parse(tokens);
    const { children: [ para ] } = ast;
    const { children: [ t1, footnote ] } = para;

    expect(footnote.children).toHaveLength(2);
  });

  it('should parse blockquotes', () => {
    const tokens = tokenize('Para.\n\n____\nQuote.\n____');
    const ast = parse(tokens);
    const { children: [ para, quote ] } = ast;

    expect(quote.type).toBe('Blockquote');
    expect(quote.children).toHaveLength(1);
    expect(quote.children[0].type).toBe('Paragraph');
    expect(quote.children[0].children[0]).toMatchObject({ type: 'Text', 'value': 'Quote.' });
  });

  const citations = [
    ['[quote, George Fox]', 'George Fox', null],
    ['[quote, George Fox, Journal]', 'George Fox', 'Journal'],
    ['[quote, "Fox, George", Journal]', 'Fox, George', 'Journal'],
    ['[quote, George Fox, "Journal"]', 'George Fox', 'Journal'],
    ["[quote, 'Fox, George', Journal]", 'Fox, George', 'Journal'],
    ["[quote, George Fox, 'Journal']", 'George Fox', 'Journal'],
    ['[quote, Bob, "Apology, prop. 7, sec. 3"]', 'Bob', 'Apology, prop. 7, sec. 3'],
    ['[quote, , "Apology, prop. 7, sec. 3"]', null, 'Apology, prop. 7, sec. 3'],
  ];

  test.each(citations)(`quote meta %s should parse correctly`, (raw, author, source) => {
    const tokens = tokenize(`Para.\n\n${raw}\n____\nQuote.\n____`);
    const ast = parse(tokens);
    const { children: [ _, { meta } ] } = ast;

    if (author) {
      expect(meta.author).toBe(author);
    }
    if (source) {
      expect(meta.source).toBe(source);
    }
  });
});
