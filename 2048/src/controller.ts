export type Action = 'up' | 'right' | 'down' | 'left' | 'none'

type Observer = {
  next: (action: Action, time: number) => void
}

export default function subscribe(o: Observer) {
  let touchX = 0
  let touchY = 0
  let touchEndable = false
  let action: Action = 'none'
  const canvasEl = document.getElementById('app') as HTMLCanvasElement

  const loop = (time: number) => {
    o.next(action, time)
    action = 'none'
    requestAnimationFrame(loop)
  }

  loop(Date.now())

  canvasEl.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      touchEndable = true
      const touch = e.touches[0]
      touchX = touch.clientX
      touchY = touch.clientY
    } else {
      touchEndable = false
    }
  })

  // prevent page scrolling
  canvasEl.addEventListener('touchmove', e => e.preventDefault(), { passive: false })

  canvasEl.addEventListener('touchend', e => {
    const touch = e.changedTouches[0]

    if (touch && touchEndable) {
      const deltaX = touch.clientX - touchX
      const deltaY = touch.clientY - touchY

      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        action = deltaX > 0 ? 'right' : 'left'
      } else if (Math.abs(deltaY) > 10 && Math.abs(deltaX) < Math.abs(deltaY)) {
        action = deltaY > 0 ? 'down' : 'up'
      }
    }
  })

  document.addEventListener('keyup', e => {
    switch(e.code) {
      case 'ArrowUp':
        action = 'up'
        break
      case 'ArrowRight':
        action = "right"
        break
      case 'ArrowDown':
        action = 'down'
        break
      case 'ArrowLeft':
        action = 'left'
        break
      default:
    }
  })
}
