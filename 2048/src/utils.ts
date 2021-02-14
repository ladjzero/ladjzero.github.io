import zip from 'lodash/zip'
import chunk from 'lodash/chunk'
import reverse from 'lodash/reverse'
import Brick from './brick'

export function rect(ctx: CanvasRenderingContext2D, radius = 10) {
  ctx.beginPath()
  ctx.moveTo(ctx.x + radius, ctx.y)
  ctx.lineTo(ctx.x + ctx.w - radius, ctx.y)
  ctx.quadraticCurveTo(ctx.x + ctx.w, ctx.y, ctx.x + ctx.w, ctx.y + radius)
  ctx.lineTo(ctx.x + ctx.w, ctx.y + ctx.w - radius)
  ctx.quadraticCurveTo(ctx.x + ctx.w, ctx.y + ctx.w, ctx.x + ctx.w - radius, ctx.y + ctx.w)
  ctx.lineTo(ctx.x + 10, ctx.y + ctx.w)
  ctx.quadraticCurveTo(ctx.x, ctx.y + ctx.w, ctx.x, ctx.y + ctx.w - radius)
  ctx.lineTo(ctx.x, ctx.y + radius)
  ctx.quadraticCurveTo(ctx.x, ctx.y, ctx.x + radius, ctx.y)
  return ctx.fill()
}

export function transaction(ctx: CanvasRenderingContext2D, fn: (ctx: CanvasRenderingContext2D) => void) {
  const { x, y, w, h, fillStyle, globalAlpha } = ctx
  fn(ctx)
  Object.assign(ctx, { x, y, w, h, fillStyle, globalAlpha })
}

const t = transaction

export { t }

export function rotateRight(mtr: any[][]) {
  return reverse(zip(...mtr))
}

export function iterate<T = any>(mtr: T[], iterator: (t: T, i: number, j: number, idx: number) => boolean | void) {
  const map = chunk(mtr, Math.sqrt(mtr.length))

  for (let i = 0; i < map.length; i++) {
    const line = map[i]

    for (let j = 0; j < line.length; j++) {
      if (iterator(line[j], i, j, i * map.length + j)) {
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
