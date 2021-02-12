import Grid from "./grid";
export function parse(exp: string): number[][] {
  return exp
    .split(/[\n\r|]/)
    .map(line => {
      line.trim()
      return line.split('').map(char => Number.isNaN(+char) ? null : +char)
    })
}

export function toString(arr: number[][]): string {
  return arr.map(line => line.map(num => num ? num : '.').join('')).join('|')
}