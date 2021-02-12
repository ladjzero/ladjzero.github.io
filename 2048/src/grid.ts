import Brick from "./brick"
import { Action } from "./controller"
import { rect, t } from "./utils"
import * as DSL from './dsl'

class Grid {
  constructor(private ctx: CanvasRenderingContext2D, private size: number) {
    this.bricks = new Array(size)

    for (let i = 0; i < size; i++) {
      this.bricks[i] = new Array(size)
    }

    this.seed()
  }

  static from(exp: string): Grid {
    const map = DSL.parse(exp)
    const grid = new Grid(null, map.length)

    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[0].length; j++) {
        grid.bricks[i][j] = map[i][j] ? new Brick(null, map[i][j]) : null
      }
    }

    return grid
  }

  toString(): string {
    const arr = new Array(this.bricks.length)
    
    for (let i = 0; i < this.bricks.length; i++) {
      arr[i] = new Array(this.bricks.length)
    }

    for (let i = 0; i < this.bricks.length; i++) {
      for (let j = 0; j < this.bricks.length; j++) {
        arr[i][j] = this.bricks[i][j] && this.bricks[i][j].sum
      }
    }

    return DSL.toString(arr)
  }

  bricks: Brick[][]

  seed(): boolean {
    const tuple: [number, number][] = []

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (!this.bricks[i][j]) {
          tuple.push([i, j])
        }
      }
    }

    if (!tuple.length) {
      return false
    } else {
      const randomKey = Math.round(Math.random() * tuple.length * 100)
      const [i, j] = tuple[randomKey % tuple.length]
      this.bricks[i][j] = new Brick(this.ctx, 2 ** (1 + randomKey % 2))
      return true
    }
  }

  compact(action: Action): boolean {
    let compacted: boolean
    let loop: boolean
    let summed = false

    do {
      loop = false

      switch(action) {
        case 'up':
          for (let i = 0; i < this.size; i++) {
            for (let j = 1; j < this.size; j++) {
              if (this.bricks[i][j] && !this.bricks[i][j - 1]) {
                this.bricks[i][j - 1] = this.bricks[i][j]
                this.bricks[i][j] = null
                loop = compacted = true
              }
            }
          }

          if (!summed) {
            for (let i = 0; i < this.size; i++) {
              for (let j = 1; j < this.size; j++) {
                if (this.bricks[i][j] && this.bricks[i][j - 1] && this.bricks[i][j].sum === this.bricks[i][j - 1].sum) {
                  this.bricks[i][j - 1].sum *= 2
                  this.bricks[i][j] = null
                  loop = compacted = true
                  summed = true
                }
              }
            }
          }
          break
        case 'right':
          for (let i = this.size - 2; i >= 0; i--) {
            for (let j = 0; j < this.size; j++) {
              if (this.bricks[i][j] && !this.bricks[i + 1][j]) {
                this.bricks[i + 1][j] = this.bricks[i][j]
                this.bricks[i][j] = null
                loop = compacted = true
              }
            }
          }

          if (!summed) {
            for (let i = this.size - 2; i >= 0; i--) {
              for (let j = 0; j < this.size; j++) {
                if (this.bricks[i][j] && this.bricks[i + 1][j] && this.bricks[i][j].sum === this.bricks[i + 1][j].sum) {
                  this.bricks[i + 1][j].sum *= 2
                  this.bricks[i][j] = null
                  loop = compacted = true
                  summed = true
                }
              }
            }
          }
          break
        case 'down':
          for (let i = 0; i < this.size; i++) {
            for (let j = this.size - 2; j >= 0; j--) {
              if (this.bricks[i][j] && !this.bricks[i][j + 1]) {
                this.bricks[i][j + 1] = this.bricks[i][j]
                this.bricks[i][j] = null
                loop = compacted = true
              }
            }
          }

          if (!summed) {
            for (let i = 0; i < this.size; i++) {
              for (let j = this.size - 2; j >= 0; j--) {
                if (this.bricks[i][j] && this.bricks[i][j + 1] && this.bricks[i][j].sum === this.bricks[i][j + 1].sum) {
                  this.bricks[i][j + 1].sum *= 2
                  this.bricks[i][j] = null
                  loop = compacted = true
                  summed = true
                }
              }
            }
          }
          break
        case 'left':
          for (let i = 1; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
              if (this.bricks[i][j] && !this.bricks[i - 1][j]) {
                this.bricks[i - 1][j] = this.bricks[i][j]
                this.bricks[i][j] = null
                loop = compacted = true
              }
            }
          }

          if (!summed) {
            for (let i = 1; i < this.size; i++) {
              for (let j = 0; j < this.size; j++) {
                if (this.bricks[i][j] && this.bricks[i - 1][j] && this.bricks[i][j].sum === this.bricks[i - 1][j].sum) {
                  this.bricks[i - 1][j].sum *= 2
                  this.bricks[i][j] = null
                  loop = compacted = true
                  summed = true
                }
              }
            }
          }
          break
      }
    } while (loop)

    return compacted
  }
  
  render() {
    const ctx = this.ctx

    this.ctx.fillStyle = ctx.theme.gridBackground
    rect(ctx, ctx.gridWidth, 20)

    ctx.fillStyle = ctx.theme.brickBackground

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        t(ctx, () => {
          ctx.x = ctx.x + i * ctx.brickWidth + (i + 1) * ctx.brickMargin
          ctx.y = ctx.y + j * ctx.brickWidth + (j + 1) * ctx.brickMargin
          rect(ctx, ctx.brickWidth)
          const brick = this.bricks[i][j]
          brick && brick.render()
        })
      }
    }
  }
}

export default Grid
