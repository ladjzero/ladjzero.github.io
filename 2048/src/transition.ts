import Brick from "./brick";
import Renderable from "./renderable";

export type TransitionState<T> = {
  from?: T
  to: T
  onResolve?: (t: any) => void
}

export default class Transition<C extends Renderable> extends Renderable<TransitionState<C>> {
  resolve(): Optional<C> {
    return null
  }
}
