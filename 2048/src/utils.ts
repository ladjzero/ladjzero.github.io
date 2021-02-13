import zip from 'lodash/zip'
import reverse from 'lodash/reverse'
import Brick from './brick'

export function rect(ctx: CanvasRenderingContext2D, width: number, radius = 10) {
  ctx.beginPath()
  ctx.moveTo(ctx.x + radius, ctx.y)
  ctx.lineTo(ctx.x + width - radius, ctx.y)
  ctx.quadraticCurveTo(ctx.x + width, ctx.y, ctx.x + width, ctx.y + radius)
  ctx.lineTo(ctx.x + width, ctx.y + width - radius)
  ctx.quadraticCurveTo(ctx.x + width, ctx.y + width, ctx.x + width - radius, ctx.y + width)
  ctx.lineTo(ctx.x + 10, ctx.y + width)
  ctx.quadraticCurveTo(ctx.x, ctx.y + width, ctx.x, ctx.y + width - radius)
  ctx.lineTo(ctx.x, ctx.y + radius)
  ctx.quadraticCurveTo(ctx.x, ctx.y, ctx.x + radius, ctx.y)
  return ctx.fill()
}

export function transaction(ctx: CanvasRenderingContext2D, fn: (ctx: CanvasRenderingContext2D) => void) {
  const { x, y, fillStyle, globalAlpha } = ctx
  fn(ctx)
  Object.assign(ctx, { x, y, fillStyle, globalAlpha })
}

const t = transaction

export { t }

export function rotateRight(mtr: any[][]) {
  return reverse(zip(...mtr))
}

export function iterate<T = any>(mtr: T[][], iterator: (t: T, i: number, j: number) => boolean | undefined) {
  for (let i = 0; i < mtr.length; i++) {
    const line = mtr[i]

    for (let j = 0; j < line.length; j++) {
      if (iterator(line[i][j], i, j)) {
        break
      }
    }
  }
}

export function finished(bricks: Brick[][]) {
  let full = true

  iterate(bricks, b => {
    full = !!b
    return !full
  })
  
  if (full) {

  }
}
