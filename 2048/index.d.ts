interface CanvasRenderingContext2D {
  width: number
  height: number
  gridWidth: number
  brickWidth: number
  brickMargin: number
  x: number
  y: number
  theme: {
    gridBackground: string
    brickBackground: string
    brick: { [key: string]: [ string, string ]}
  }
}

declare module '*.mov?url' {
  const url: string
  export default url
}
