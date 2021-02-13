import { Position } from "./grid"
import Renderable from "./renderable"
import { rect } from "./utils"
class Brick extends Renderable<Position & { sum: number }> {
  isEqual(to: Brick) {
    return this.state.sum === to.state.sum
  }

  toString() {
    return String(this.state)
  }

  render() {
    const ctx = this.ctx
    ctx.fillStyle = ctx.theme.brick[this.state.sum][0]
    rect(ctx, ctx.brickWidth)
    ctx.fillStyle = ctx.theme.brick[this.state.sum][1]
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${ctx.brickWidth / 2}px sans-serif`
    ctx.fillText(String(this.state.sum), ctx.x + ctx.brickWidth / 2, ctx.y + ctx.brickWidth / 2)
  }
}

export default Brick
