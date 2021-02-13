import Renderable from "./renderable";
import Transition from "./transition";
import { t } from "./utils";

export default class FadeTransition<C extends Renderable> extends Transition<C> {
  layout(i: number, j: number): [x: number, y: number] {
    const ctx = this.ctx
    const x = ctx.x + i * ctx.brickWidth + (i + 1) * ctx.brickMargin
    const y = ctx.y + j * ctx.brickWidth + (j + 1) * ctx.brickMargin
    return [x, y]
  }

  resolve() {
    this.state.onResolve && this.state.onResolve(this)
    return this.state.to
  }

  render() {
    const ctx = this.ctx
    const { i, j } = this.state.to.state
    const [newOffsetX, newOffsetY] = this.layout(i, j)
    t(ctx, () => {
      ctx.globalAlpha = ctx.transitionProgress
      ctx.x = newOffsetX
      ctx.y = newOffsetY
      this.state.to.render()
    })
  }
}