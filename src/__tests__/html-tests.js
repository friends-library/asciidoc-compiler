import tokenize from '../tokenize';
import parse from '../parse';
import toHtml from '../html';
import { logJson, formatHtml as format } from '../helpers';

let mockCounter = 0;

jest.mock('uuid/v4', () => {
  return jest.fn(() => `uuid${++mockCounter}`);
});

function expectHtml(actual: string, expected: string): void {
  return expect(`\n${format(actual)}`).toBe(`\n${format(expected)}`);
}

describe('toHtml()', () => {

  beforeEach(() => {
    mockCounter = 0;
  });

  it('converts a one word sentence', () => {
    const html = toHtml(parse(tokenize('Foo')));
    expectHtml(html, '<div class="content"><p>Foo</p></div>');
  });

  it('converts italics', () => {
    const html = toHtml(parse(tokenize('=Foo _bar_.')));
    expectHtml(html, '<div class="content"><h1>Foo <em>bar</em>.</h1></div>');
  });

  it('handles bold within a header', () => {
    const html = toHtml(parse(tokenize('=Foo *bar*')));
    expectHtml(html, '<div class="content"><h1>Foo <strong>bar</strong></h1></div>');
  });

  it('can handle a moderately complex combination', () => {
    const ascii = 'A para\n\nOne *with emphasis.*\n\n==A heading\n\nLol *rofl* foo.';
    const html = toHtml(parse(tokenize(ascii)));
    expectHtml(html, `
      <div class="content">
        <p>A para</p>
        <p>One <strong>with emphasis.</strong></p>
        <h2 id="_uuid1" class="chapter">A heading</h2>
        <p>Lol <strong>rofl</strong> foo.</p>
      </div>
    `);
  });

  it('shows combined sentences within paragraph', () => {
    const html = toHtml(parse(tokenize('Foo.\nBar.')));
    expectHtml(html, '<div class="content"><p>Foo. Bar.</p></div>');
  });

  it('marks up blockquotes with attribution', () => {
    const ast = parse(tokenize('Foo\n\n[quote, G.F., Journal]\n____\nQuote\n____'));
    const html = toHtml(ast);
    expectHtml(html, `
      <div class="content">
        <p>Foo</p>
        <blockquote>
          <p>Quote</p>
        </blockquote>
        <div class="blockquote-citation">
          <span class="blockquote-citation__author">G.F.</span>
          <cite class="blockquote-citation__source">Journal</cite>
        </div>
      </div>
    `);
  });

  it('marks up blockquotes without attribution', () => {
    const ast = parse(tokenize('Foo\n\n____\nQuote\n____'));
    const html = toHtml(ast);
    expectHtml(html, `
      <div class="content">
        <p>Foo</p>
        <blockquote>
          <p>Quote</p>
        </blockquote>
      </div>
    `);
  });

  it('marks up footnotes correctly', () => {
    const ast = parse(tokenize('Foo.footnote:[bar\n¶baz]'));
    const html = toHtml(ast);

    expectHtml(html, `
      <div class="content">
        <p>Foo.<a href="#_uuid1" id="ref-uuid1" class="footnote-call"></a></p>
      </div>
      <hr />
      <div class="footnote-area">
        <div id="_uuid1" class="footnote-body">
          <a href="#ref-uuid1" class="footnote-body__marker"></a>
          <div class="footnote-body__element">
            <p>bar</p>
            <p>baz</p>
          </div>
        </div>
      </div>
    `);
  });
});
