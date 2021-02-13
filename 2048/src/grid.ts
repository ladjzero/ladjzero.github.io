import cloneDeep from 'lodash/cloneDeep'
import Brick from "./brick"
import { Action } from "./controller"
import { rect, rotateRight, t } from "./utils"
import * as DSL from './dsl'
import Renderable from './renderable'
import PositionTransition from './transition-position'
import MergeTransition from './transition-merge'
import FadeTransition from './transition-fade'
import Transition from './transition'

export interface Position {
  i: number
  j: number
}

class Grid {
  static from(exp: string, ctx?: CanvasRenderingContext2D): Grid {
    const map = DSL.parse(exp)
    const grid = new Grid(ctx!, map.length)

    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[0].length; j++) {
        grid.bricks[i][j] = map[i][j] ? new Brick(ctx!, { i, j, sum: map[i][j]! }) : null
      }
    }

    return grid
  }

  bricks: Optional<Brick>[][]

  stagedBricks: Optional<Renderable>[][] | null

  constructor(public ctx: CanvasRenderingContext2D, private size: number) {
    this.bricks = new Array(size).fill(null)
    this.stagedBricks = null

    for (let i = 0; i < size; i++) {
      this.bricks[i] = new Array(size).fill(null)
    }

    this.seed(this.bricks, true)
  }

  toString(): string {
    const arr = new Array(this.bricks.length)
    
    for (let i = 0; i < this.bricks.length; i++) {
      arr[i] = new Array(this.bricks.length)
    }

    for (let i = 0; i < this.bricks.length; i++) {
      for (let j = 0; j < this.bricks.length; j++) {
        arr[i][j] = this.bricks[i][j]?.toString()
      }
    }

    return DSL.toString(arr)
  }

  seed(bricks: Optional<Renderable>[][], init?: boolean): boolean {
    const tuple: [number, number][] = []

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (!bricks[i][j]) {
          tuple.push([i, j])
        }
      }
    }

    if (!tuple.length) {
      return false
    } else {
      const randomKey = Math.round(Math.random() * tuple.length * 100)
      const [i, j] = tuple[randomKey % tuple.length]

      if (init) {
        bricks[i][j] = new Brick(this.ctx, { i, j, sum: 2 ** (1 + randomKey % 2) })
      } else {
        bricks[i][j] = new FadeTransition(this.ctx, {
          to: new Brick(this.ctx, { i, j, sum: 2 ** (1 + randomKey % 2) })
        })
      }
      
      return true
    }
  }

  compact(action: Action): Optional<Renderable>[][] | null {
    let compacted = false
    let loop: boolean
    let summed = false
    let mergeTransitions: Map<number, MergeTransition<Brick>> = new Map()

    let bricks: Optional<Renderable>[][] = cloneDeep(this.bricks)
    const brickIdxByKey: Map<number, Brick> = new Map()

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const brick = this.bricks[i][j]

        if (brick) {
          brickIdxByKey.set(brick.key, brick)
        }
      }
    }

    switch(action) {
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
  
        if (!summed) {
          for (let i = this.size - 2; i >= 0; i--) {
            for (let j = 0; j < this.size; j++) {
              if (bricks[i][j] && bricks[i + 1][j] && bricks[i][j]?.isEqual(bricks[i + 1][j]!)) {
                mergeTransitions.set(bricks[i + 1][j]!.key, new MergeTransition(this.ctx, {
                  from: brickIdxByKey.get(bricks[i][j]!.key)!,
                  to: bricks[i + 1][j]!,
                  onResolve(t: MergeTransition<Brick>) {
                    t.state.to.state.sum *= 2
                    // bricks[i + 1][j]!.state.sum *= 2
                  }
                }))
                bricks[i][j] = null
                loop = compacted = true
                summed = true
              }
            }
          }
        }
      }
    } while (loop)

    switch(action) {
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
            } else
            
            if (oldBrick) {
              bricks[i][j] = new PositionTransition(this.ctx, {
                from: oldBrick,
                to: brick,
              })
            }
          }
        }
      }

      return bricks
    }

    return null
  }
  
  layout(i: number, j: number): [x: number, y: number] {
    const ctx = this.ctx
    const x = ctx.x + i * ctx.brickWidth + (i + 1) * ctx.brickMargin
    const y = ctx.y + j * ctx.brickWidth + (j + 1) * ctx.brickMargin
    return [x, y]
  }

  render() {
    const ctx = this.ctx

    this.ctx.fillStyle = ctx.theme.gridBackground
    rect(ctx, ctx.gridWidth, 20)

    ctx.fillStyle = ctx.theme.brickBackground

    const brickIdxByKey: Map<number, [number, number]> = new Map()

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        t(ctx, () => {
          ctx.x = ctx.x + i * ctx.brickWidth + (i + 1) * ctx.brickMargin
          ctx.y = ctx.y + j * ctx.brickWidth + (j + 1) * ctx.brickMargin
          rect(ctx, ctx.brickWidth)
        })

        const brick = this.bricks[i][j]

        if (brick) {
          brickIdxByKey.set(brick.key, [i, j])
        }
      }
    }

    // console.log('brickIdxByKey', brickIdxByKey)

    if (this.stagedBricks) {
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const b = this.stagedBricks[i][j]

          if (b instanceof Transition) {
            t(ctx, () => b.render())
          } else if (b instanceof Brick) {
            t(ctx, () => {
              [ctx.x, ctx.y] = this.layout(i, j)
              b.render()
            })
          }
        }
      }
    } else {
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const b = this.bricks[i][j]

          b && t(ctx, () => {
            [ctx.x, ctx.y] = this.layout(i, j)
            b.render()
          })
        }
      }
    }
  }
}

export default Grid
