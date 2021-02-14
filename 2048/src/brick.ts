import Renderable from "./renderable"
import { rect } from "./utils"
class Brick extends Renderable<{ i: number, j: number, sum: number }> {
  isEqual(to: Brick) {
    return this.state.sum === to.state.sum
  }

  toString() {
    return String(this.state.sum)
  }

  layout() {
    const ctx = this.ctx
    const { i, j } = this.state
    const x = ctx.x + i * ctx.brickWidth + (i + 1) * ctx.brickMargin
    const y = ctx.y + j * ctx.brickWidth + (j + 1) * ctx.brickMargin
    return { x, y, w: ctx.brickWidth, h: ctx.brickWidth }
  }

  render() {
    const ctx = this.ctx
    ctx.fillStyle = ctx.theme.brick[this.state.sum][0]
    rect(ctx)
    ctx.fillStyle = ctx.theme.brick[this.state.sum][1]
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${ctx.brickWidth / 2}px sans-serif`
    ctx.fillText(String(this.state.sum), ctx.x + ctx.brickWidth / 2, ctx.y + ctx.brickWidth / 2)
  }
}

export default Brick
