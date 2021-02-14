export function parse(exp: string): Optional<number>[][] {
  return exp
    .split(/[\n\r|]/)
    .map(line => {
      line.trim()
      return line.split('').map(char => Number.isNaN(+char) ? null : +char)
    })
}

export function toString(arr: Optional<number>[][]): string {
  return arr.map(line => line.map(num => num ? num : '.').join('')).join('|')
}
