// @flow
import uuid from 'uuid/v4';
import type { Node } from './type';

function leafHtml(leaf: Node): string {
  return leaf.value || '';
}

function parentHtml(parent: Node): string {
  const open = openTag(parent);
  const inner = parent.children.map(visitNode).join('');
  const close = closeTag(parent);
  return [open, inner, close].join('');
}

function openTag(node: Node): string {
  switch (node.type) {
    case 'Paragraph':
      return '<p>';
    case 'Heading1':
      return '<h1>';
    case 'Heading2':
      return `<h2 id="_${uuid()}" class="chapter">`;
    case 'Italic':
      return '<em>';
    case 'Bold':
      return '<strong>';
    case 'Blockquote':
      return '<blockquote>';
    default:
      return '';
  }
}

function closeTag(node: Node): string {
  switch (node.type) {
    case 'Paragraph':
      return '</p>';
    case 'Heading1':
      return '</h1>';
    case 'Heading2':
      return '</h2>';
    case 'Italic':
      return '</em>';
    case 'Bold':
      return '</strong>';
    case 'Blockquote':
      return closeBlockquote(node);
    default:
      return '';
  }
}

function closeBlockquote({ meta }: Node): string {
  let end = '</blockquote>';
  if (!meta) {
    return end;
  }
  const { author, source }: {| author?: string, source?: string |} = meta;
  return [
    end,
    '<div class="blockquote-citation">',
      author ? `<span class="blockquote-citation__author">${author}</span>` : '',
      source ? `<cite class="blockquote-citation__source">${source}</cite>` : '',
    '</div>',
  ].join('');
}

function addFootnote(id: string, node: Node): void {
  footnotes += [
    `<div id="_${id}" class="footnote-body">`,
      `<a href="#ref-${id}" class="footnote-body__marker"></a>`,
      '<div class="footnote-body__element">',
        node.children.reduce((acc, child) => `${acc}${visitNode(child)}`, ''),
      '</div>',
    '</div>',
  ].join('');
}

function visitNode(node: Node): string {
  if (node.type === 'Footnote') {
    const id = uuid();
    addFootnote(id, node);
    return `<a href="#_${id}" id="ref-${id}" class="footnote-call"></a>`;
  }
  if (node.children.length) {
    return parentHtml(node);
  }
  return leafHtml(node);
}

let footnotes: string = '';

export default function toHtml(root: Node): string {
  footnotes = '';
  const content = `<div class="content">${visitNode(root)}</div>`;
  if (footnotes === '') {
    return content;
  }
  return `${content}<hr /><div class="footnote-area">${footnotes}</div>`;
}
