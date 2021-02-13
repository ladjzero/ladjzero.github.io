import Renderable from "./renderable";
import Transition from "./transition";
import { t } from "./utils";

export default class PositionTransition<C extends Renderable> extends Transition<C> {
  layout(i: number, j: number): [x: number, y: number] {
    const ctx = this.ctx
    const x = ctx.x + i * ctx.brickWidth + (i + 1) * ctx.brickMargin
    const y = ctx.y + j * ctx.brickWidth + (j + 1) * ctx.brickMargin
    return [x, y]
  }

  onResolve?: () => void

  resolve() {
    this.onResolve && this.onResolve()
    return this.state.to
  }

  render() {
    const ctx = this.ctx
    const { i: oldI, j: oldJ } = this.state.from!.state
    const { i, j } = this.state.to.state
    const [oldOffsetX, oldOffsetY] = this.layout(oldI, oldJ)
    const [newOffsetX, newOffsetY] = this.layout(i, j)
    t(ctx, () => {
      ctx.x = oldOffsetX + (newOffsetX - oldOffsetX) * ctx.transitionProgress
      ctx.y = oldOffsetY + (newOffsetY - oldOffsetY) * ctx.transitionProgress
      this.state.from!.render()
    })
  }
}