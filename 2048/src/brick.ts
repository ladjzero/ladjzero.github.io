import { rect } from "./utils"

type Sum = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192

class Brick {
  constructor(
    public ctx: CanvasRenderingContext2D,
    public sum: number,
  ) {}

  render() {
    const ctx = this.ctx
    ctx.fillStyle = ctx.theme.brick[this.sum][0]
    rect(ctx, ctx.brickWidth)
    ctx.fillStyle = ctx.theme.brick[this.sum][1]
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${ctx.brickWidth / 2}px sans-serif`
    ctx.fillText(String(this.sum), ctx.x + ctx.brickWidth / 2, ctx.y + ctx.brickWidth / 2)
  }
}

export default Brick
