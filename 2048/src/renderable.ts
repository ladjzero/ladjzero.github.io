let key = 0

export default class Renderable<State = any> {
  constructor(public ctx: CanvasRenderingContext2D, public state: State) {
    this.key = key++
  }
  key: number
  isEqual(r: this) {
    return this.state === r.state
  }
  stage(fn: (s: State) => State) {
    this.state = fn(this.state)
    return this
  }
  render() {

  }
}
