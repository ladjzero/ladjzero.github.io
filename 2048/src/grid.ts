import chunk from 'lodash/chunk'
import flatten from 'lodash/flatten'
import cloneDeep from 'lodash/cloneDeep'
import Brick from "./brick"
import { Action } from "./controller"
import { iterate, rect, rotateRight, t } from "./utils"
import * as DSL from './dsl'
import Renderable from './renderable'
import PositionTransition from './transition-position'
import MergeTransition from './transition-merge'
import FadeTransition from './transition-fade'
import Transition from './transition'

export default class Grid extends Renderable<number>{
  static from(exp: string, ctx?: CanvasRenderingContext2D): Grid {
    const map = DSL.parse(exp)
    const grid = new Grid(ctx!, map.length)

    iterate(flatten(map), (node, i, j, idx) => {
      grid.children[idx] = node ? new Brick(ctx!, { i, j, sum: node }) : null
    })

    console.log('from', exp, grid.toString())

    return grid
  }

  children: Optional<Brick>[]

  stagedChildren: Optional<Renderable>[] | null

  constructor(public ctx: CanvasRenderingContext2D, private size: number) {
    super(ctx, size)
    this.children = new Array(size * size).fill(null)
    this.stagedChildren = null

    this.seed(this.children, true)
  }

  resolve() {
    if (this.stagedChildren) {
      this.children = this.stagedChildren.map(b => {
        if (b instanceof Transition) {
          return b.resolve()
        }

        return b
      })

      this.stagedChildren = null
    }
  }

  toString(): string {
    const arr = this.children.map(node => node ? +node.toString() : null)

    return DSL.toString(chunk(arr, Math.sqrt(arr.length)))
  }

  seed(bricks: Optional<Renderable>[], init?: boolean): boolean {
    const tuple: [number, number, number][] = []

    iterate(bricks, (node, i, j, idx) => {
      if (!node) {
        tuple.push([i, j, idx])
      }
    })

    if (!tuple.length) {
      return false
    } else {
      const randomKey = Math.round(Math.random() * tuple.length * 100)
      const [i, j, idx] = tuple[randomKey % tuple.length]

      if (init) {
        bricks[idx] = new Brick(this.ctx, { i, j, sum: 2 ** (1 + randomKey % 2) })
      } else {
        bricks[idx] = new FadeTransition(this.ctx, {
          to: new Brick(this.ctx, { i, j, sum: 2 ** (1 + randomKey % 2) })
        })
      }

      return true
    }
  }

  compact(action: Action): Optional<Renderable>[] | null {
    let compacted = false
    let loop: boolean
    let mergeTransitions: Map<number, MergeTransition<Brick>> = new Map()
    let bricks: Optional<Renderable>[][] = chunk(cloneDeep(this.children), Math.sqrt(this.children.length))
    const brickIdxByKey: Map<number, Brick> = new Map()
    const settlements: Set<number> = new Set()

    iterate(this.children, (node) => {
      if (node) {
        brickIdxByKey.set(node.key, node)
      }
    })

    switch (action) {
      case 'down':
        bricks = rotateRight(bricks)
      case 'left':
        bricks = rotateRight(bricks)
      case 'up':
        bricks = rotateRight(bricks)
      case 'right':
    }

    do {
      loop = false

      if (action !== 'none') {
        for (let i = this.size - 2; i >= 0; i--) {
          for (let j = 0; j < this.size; j++) {
            if (bricks[i][j] && !bricks[i + 1][j]) {
              bricks[i + 1][j] = bricks[i][j]
              bricks[i][j] = null
              loop = compacted = true
            }
          }
        }

        for (let i = this.size - 2; i >= 0; i--) {
          for (let j = 0; j < this.size; j++) {
            const l = bricks[i][j]
            const r = bricks[i + 1][j]
            if (l && r && l.isEqual(r) && !settlements.has(l.key) && !settlements.has(r.key)) {
              settlements.add(l.key)
              settlements.add(r.key)

              mergeTransitions.set(r.key, new MergeTransition(this.ctx, {
                from: brickIdxByKey.get(l.key),
                to: r,
                onResolve(t: MergeTransition<Brick>) {
                  t.state.to.state.sum *= 2
                }
              }))
              bricks[i][j] = null
              loop = compacted = true
            }
          }
        }
      }
    } while (loop)

    switch (action) {
      case 'up':
        bricks = rotateRight(bricks)
      case 'left':
        bricks = rotateRight(bricks)
      case 'down':
        bricks = rotateRight(bricks)
      case 'right':
    }

    if (compacted) {
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (bricks[i][j]) {
            bricks[i][j]!.state.i = i
            bricks[i][j]!.state.j = j
          }
        }
      }

      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const brick = bricks[i][j]

          if (brick) {
            const mergeTransition = mergeTransitions.get(brick.key)
            const oldBrick = brickIdxByKey.get(brick.key)

            if (mergeTransition) {
              bricks[i][j] = mergeTransition
            } else if (oldBrick) {
                bricks[i][j] = new PositionTransition(this.ctx, {
                  from: oldBrick,
                  to: brick,
                })
              }
          }
        }
      }

      return flatten(bricks)
    }

    return null
  }

  layout() {
    const ctx = this.ctx

    return {
      x: (ctx.width - ctx.gridWidth) / 2,
      y: (ctx.height - ctx.gridWidth) / 2,
      w: ctx.gridWidth,
      h: ctx.gridWidth,
    }
  }

  render() {
    const ctx = this.ctx

    this.ctx.fillStyle = ctx.theme.gridBackground
    rect(ctx, 20)

    ctx.fillStyle = ctx.theme.brickBackground

    iterate(this.children, (node, i, j) => {
      t(ctx, () => {
        ctx.x = ctx.x + i * ctx.brickWidth + (i + 1) * ctx.brickMargin
        ctx.y = ctx.y + j * ctx.brickWidth + (j + 1) * ctx.brickMargin
        ctx.w = ctx.brickWidth
        ctx.h = ctx.brickWidth
        rect(ctx)
      })
    })
  }
}
