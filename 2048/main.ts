import './style.css'
import Grid from './src/grid'
import { t } from './src/utils'
import controller, { Action } from './src/controller'
import theme from './theme.json'
import audioBubble from './assets/bubble.mov?url'
import Transition from './src/transition'
import CanvasRenderer from './src/render-canvas'

const TRANSITION_DURATION = 200
let SIZE = 4

const dpr = devicePixelRatio
const audioEl = new Audio(audioBubble)
const canvasEl = document.getElementById('app') as HTMLCanvasElement
const ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D
const renderer = new CanvasRenderer(ctx)
let grid = new Grid(ctx, SIZE)
// console.log(grid)
// grid = Grid.from('2...|.2..|.2..|2...', ctx)
// console.log(grid)
let transitionStart = 0
let started = false

controller({
  next(action, time) {
    if (!started) return

    if (action !== 'none' && !transitionStart) {
      transitionStart = time
      grid.stagedChildren = grid.compact(action)

      if (grid.stagedChildren) {
        audioEl.play()

        if (!grid.seed(grid.stagedChildren)) {
          alert('failed')
          throw Error('exit')
        }
      }
    }

    if (transitionStart && time - transitionStart > TRANSITION_DURATION) {
      transitionStart = 0
      if (grid.stagedChildren) {
        grid.children = grid.stagedChildren.map(b => {
          if (b instanceof Transition) {
            return b.resolve()
          }

          return b
        })

        const actions: Action[] = ['up', 'right', 'down', 'left']

        if (actions.every(a => !grid.compact(a))) {
          setTimeout(() => {
            if (confirm('无法继续，重新开始？')) {
              grid = new Grid(ctx, 4)
            }
          }, 1000)
        }
      }
      grid.stagedChildren = null
    }

    if (transitionStart) {
      ctx.transitionProgress = (time - transitionStart) / TRANSITION_DURATION
    }

    renderer.render(grid)
  }
})

const main = () => {
  const { width, height } = canvasEl.getBoundingClientRect()
  ctx.theme = theme as any
  ctx.x = 0
  ctx.y = 0
  ctx.width = canvasEl.width = width * dpr
  ctx.height = canvasEl.height = height * dpr
  ctx.w = ctx.width
  ctx.h = ctx.height
  ctx.gridWidth = Math.floor((Math.min(ctx.width, ctx.height) * 0.8))
  ctx.brickMargin = ctx.gridWidth / (10 * SIZE + 1)
  ctx.brickWidth = 9 * ctx.brickMargin
  
  t(ctx, () => renderer.render(grid))
  started = true
}

(document.getElementById('size') as HTMLInputElement).addEventListener('change', (e: InputEvent) => {
  SIZE = Number((e.target as HTMLInputElement).value) || 4
  grid = new Grid(ctx, SIZE)
  main()
})
window.addEventListener('load', main)
window.addEventListener('resize', main)