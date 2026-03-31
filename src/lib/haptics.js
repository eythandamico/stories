export function hapticLight() {
  navigator.vibrate?.(10)
}

export function hapticMedium() {
  navigator.vibrate?.(25)
}

export function hapticHeavy() {
  navigator.vibrate?.(50)
}

export function hapticSuccess() {
  navigator.vibrate?.([10, 50, 20])
}

export function hapticError() {
  navigator.vibrate?.([30, 50, 30, 50, 30])
}
