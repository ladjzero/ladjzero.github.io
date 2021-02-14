let key = 0

export type RenderType = 'transition' | 'grid' | 'brick'
export type LayoutMeta = {
  x: number
  y: number
  w: number
  h: number
}

export default class Renderable<State = any> {
  constructor(public ctx: CanvasRenderingContext2D, public state: State) {
    this.key = key++
  }
  type: RenderType
  key: number
  private layoutMeta: LayoutMeta
  children: Optional<Renderable>[]
  stagedChildren: Optional<Renderable>[] | null
  layout(): LayoutMeta {
    const { x, y, w, h } = this.ctx
    return { x, y, w, h }
  }
  isEqual(r: this) {
    return this.state === r.state
  }
  stage(fn: (s: State) => State) {
    this.state = fn(this.state)
    return this
  }
  render() {

  }
}
