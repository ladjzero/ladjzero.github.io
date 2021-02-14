interface CanvasRenderingContext2D {
  width: number
  height: number
  gridWidth: number
  brickWidth: number
  brickMargin: number
  x: number
  y: number
  w: number
  h: number
  transitionProgress: number
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

type Optional<T> = T | null
