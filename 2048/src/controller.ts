export type Action = 'up' | 'right' | 'down' | 'left'

type Observer = {
  next: (action: Action) => void
}

export default function subscribe(o: Observer) {
  let touchX = 0
  let touchY = 0
  let touchEndable = false

  document.addEventListener('touchstart', e => {
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
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })

  document.addEventListener('touchend', e => {
    const touch = e.changedTouches[0]

    if (touch && touchEndable) {
      const deltaX = touch.clientX - touchX
      const deltaY = touch.clientY - touchY

      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        o.next(deltaX > 0 ? 'right' : 'left')
      } else if (Math.abs(deltaY) > 10 && Math.abs(deltaX) < Math.abs(deltaY)) {
        o.next(deltaY > 0 ? 'down' : 'up')
      }
    }
  })

  document.addEventListener('keyup', e => {
    switch(e.code) {
      case 'ArrowUp':
        o.next('up')
        break
      case 'ArrowRight':
        o.next("right")
        break
      case 'ArrowDown':
        o.next('down')
        break
      case 'ArrowLeft':
        o.next('left')
        break
      default:
    }
  })
}
