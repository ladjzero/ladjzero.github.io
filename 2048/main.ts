import chunk from 'lodash/chunk'
import flatten from 'lodash/flatten'
import './style.css'
import Grid from './src/grid'
import { t } from './src/utils'
import controller, { Action } from './src/controller'
import theme from './theme.json'
import audioBubble from './assets/bubble.mov?url'
import Transition from './src/transition'


const TRANSITION_DURATION = 200

const dpr = devicePixelRatio
const audioEl = new Audio(audioBubble)
const canvasEl = document.getElementById('app') as HTMLCanvasElement
const ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D
let grid = new Grid(ctx, 4)
console.log(grid)
// grid = Grid.from('.2..|....|.2..|....', ctx)
// console.log(grid)
let transitionStart = 0
let started = false

controller({
  next(action, time) {
    if (!started) return

    if (action !== 'none' && !transitionStart) {
      transitionStart = time
      grid.stagedBricks = grid.compact(action)

      if (grid.stagedBricks) {
        audioEl.play()

        if (!grid.seed(grid.stagedBricks)) {
          alert('failed')
          throw Error('exit')
        }
      }
    }

    if (transitionStart && time - transitionStart > TRANSITION_DURATION) {
      transitionStart = 0
      if (grid.stagedBricks) {
        grid.bricks = chunk(flatten(grid.stagedBricks).map(b => {
          if (b instanceof Transition) {
            return b.resolve()
          }

          return b
        }), 4)

        const actions: Action[] = ['up', 'right', 'down', 'left']

        if (actions.every(a => !grid.compact(a))) {
          setTimeout(() => {
            if (confirm('无法继续，重新开始？')) {
              grid = new Grid(ctx, 4)
            }
          }, 1000)
        }
      }
      grid.stagedBricks = null
    }

    if (transitionStart) {
      ctx.transitionProgress = (time - transitionStart) / TRANSITION_DURATION
    }

    grid.render()
  }
})

const main = () => {
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
  
  ctx.x = (ctx.width - ctx.gridWidth) / 2
  ctx.y = (ctx.height - ctx.gridWidth) / 2
  t(ctx, () => grid.render())
  started = true
}

window.addEventListener('load', main)
window.addEventListener('resize', main)
