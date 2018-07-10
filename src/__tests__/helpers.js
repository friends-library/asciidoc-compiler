// @flow
export function pretty(input: mixed): void {
  console.log(JSON.stringify(input, null, 2));
}
