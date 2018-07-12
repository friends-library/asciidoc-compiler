// @flow
import { html } from 'js-beautify';

export function logJson(input: mixed): void {
  console.log(JSON.stringify(input, null, 2));
}

export function formatHtml(input: string): string {
  return html(input, { unformatted: [] });
}
