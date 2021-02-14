import Renderable from "./renderable"
import { t } from "./utils"

export default class Renderer {
  constructor(public ctx: CanvasRenderingContext2D) { }

  render(n: Renderable) {
    const ctx = this.ctx
    t(ctx, () => {
      const { x, y, w, h } = n.layout()
      ctx.x = x
      ctx.y = y
      ctx.w = w
      ctx.h = h
      n.render()

      if (n.stagedChildren) {
        for (let node of n.stagedChildren) {
          node && this.render(node)
        }
      } else if (n.children) {
        for (let node of n.children) {
          node && this.render(node)
        }
      }
    })
  }
}
