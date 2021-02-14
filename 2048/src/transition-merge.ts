import Renderable from "./renderable";
import Transition from "./transition";

export default class MergeTransition<C extends Renderable> extends Transition<C> {
  resolve() {
    this.state.onResolve && this.state.onResolve(this)
    return this.state.to
  }

  render() {
    const ctx = this.ctx
    const { x: oldOffsetX, y: oldOffsetY, w, h } = this.state.from!.layout()
    const { x: newOffsetX, y: newOffsetY } = this.state.to!.layout()
    ctx.x = oldOffsetX + (newOffsetX - oldOffsetX) * ctx.transitionProgress
    ctx.y = oldOffsetY + (newOffsetY - oldOffsetY) * ctx.transitionProgress
    ctx.w = w
    ctx.h = h
    this.state.from!.render()
    ctx.x = newOffsetX
    ctx.y = newOffsetY
    this.state.to.render()
  }
}