import Renderable from "./renderable";
import Transition from "./transition";

export default class FadeTransition<C extends Renderable> extends Transition<C> {
  resolve() {
    this.state.onResolve && this.state.onResolve(this)
    return this.state.to
  }

  render() {
    const ctx = this.ctx
    const { x: newOffsetX, y: newOffsetY, w, h } = this.state.to.layout()
    ctx.globalAlpha = ctx.transitionProgress
    ctx.x = newOffsetX
    ctx.y = newOffsetY
    ctx.w = w
    ctx.h = h
    this.state.to.render()
  }
}