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

  // return ctx.fillRect(ctx.x, ctx.y, width, width)
}

export function transaction(ctx: CanvasRenderingContext2D, fn: (ctx: CanvasRenderingContext2D) => void) {
  const { x, y, fillStyle } = ctx
  fn(ctx)
  Object.assign(ctx, { x, y, fillStyle })
}

const t = transaction

export { t }
