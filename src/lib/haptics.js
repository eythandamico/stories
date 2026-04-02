import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export async function hapticLight() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
  } else {
    navigator.vibrate?.(10)
  }
}

export async function hapticMedium() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
  } else {
    navigator.vibrate?.(25)
  }
}

export async function hapticHeavy() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {})
  } else {
    navigator.vibrate?.(50)
  }
}

export async function hapticSuccess() {
  if (isNative) {
    await Haptics.notification({ type: NotificationType.Success }).catch(() => {})
  } else {
    navigator.vibrate?.([10, 50, 20])
  }
}

export async function hapticError() {
  if (isNative) {
    await Haptics.notification({ type: NotificationType.Error }).catch(() => {})
  } else {
    navigator.vibrate?.([30, 50, 30, 50, 30])
  }
}
