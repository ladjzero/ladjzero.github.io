import './style.css'
import Grid from './src/grid'
import { t } from './src/utils'
import controller from './src/controller'
import theme from './theme.json'
import audioBubble from './assets/bubble.mov?url'

const audioEl = new Audio(audioBubble)

const dpr = devicePixelRatio
// const audioBubble = document.getElementById('audioBubble') as HTMLAudioElement
const canvasEl = document.getElementById('app') as HTMLCanvasElement
const ctx = canvasEl.getContext('2d')
ctx.theme = theme as any
ctx.x = 0
ctx.y = 0
const { width, height } = canvasEl.getBoundingClientRect()
ctx.width = canvasEl.width = width * dpr
ctx.height = canvasEl.height = height * dpr
ctx.gridWidth = Math.floor((Math.min(ctx.width, ctx.height) * 0.8))
const size = 4
ctx.brickMargin = ctx.gridWidth / (10 * size + 1)
ctx.brickWidth = 9 * ctx.brickMargin
const grid = new Grid(ctx, 4)

ctx.x = (ctx.width - ctx.gridWidth) / 2
ctx.y = (ctx.height - ctx.gridWidth) / 2
t(ctx, () => grid.render())

controller({
  next(action) {
    if (grid.compact(action)) {
      audioEl.play()
      if (!grid.seed()) {
        alert('failed')
        throw Error('exit')
      }
      grid.render()
    }
  }
})
