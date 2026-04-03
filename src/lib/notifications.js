import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { api } from './api.js'
import { isFirebaseConfigured } from './firebase.js'

let initialized = false

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform() || initialized) return
  initialized = true

  try {
    // Set up listeners BEFORE registering so we don't miss events
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push token:', token.value)
      if (isFirebaseConfigured) {
        try {
          await api.updateMe({ push_token: token.value })
          console.log('Push token saved to server')
        } catch (e) {
          console.warn('Failed to send push token:', e)
        }
      }
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration failed:', err)
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification.notification.data
      if (data?.storyId) {
        window.location.href = `/play/${data.storyId}`
      } else if (data?.route) {
        window.location.href = data.route
      }
    })

    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return

    await PushNotifications.register()

    // Schedule streak reminder
    await scheduleStreakReminder()
  } catch (e) {
    console.warn('Push notifications not available:', e)
  }
}

// Schedule daily streak reminder at 7pm local time
export async function scheduleStreakReminder() {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    // Check permission
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return

    // Cancel existing streak reminders before rescheduling
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }] })

    // Get tomorrow at 7pm
    const tomorrow7pm = new Date()
    tomorrow7pm.setDate(tomorrow7pm.getDate() + 1)
    tomorrow7pm.setHours(19, 0, 0, 0)

    // Schedule daily streak reminder
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: "Don't lose your streak!",
          body: 'Play a story today to keep your streak going.',
          schedule: {
            at: tomorrow7pm,
            repeats: true,
            every: 'day',
          },
          sound: 'default',
          actionTypeId: 'STREAK_REMINDER',
          extra: { route: '/' },
        },
      ],
    })

    // Schedule a "come back" notification for 3 days of inactivity
    const threeDays = new Date()
    threeDays.setDate(threeDays.getDate() + 3)
    threeDays.setHours(12, 0, 0, 0)

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1002,
          title: 'New stories are waiting',
          body: "We've missed you! Come back and explore new adventures.",
          schedule: { at: threeDays },
          sound: 'default',
          extra: { route: '/explore' },
        },
      ],
    })
  } catch (e) {
    console.warn('Local notifications not available:', e)
  }
}

// Cancel the "come back" notification when user plays (they're active)
export async function cancelInactivityReminder() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: 1002 }] })
    // Reschedule for 3 days from now
    const threeDays = new Date()
    threeDays.setDate(threeDays.getDate() + 3)
    threeDays.setHours(12, 0, 0, 0)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1002,
          title: 'New stories are waiting',
          body: "We've missed you! Come back and explore new adventures.",
          schedule: { at: threeDays },
          sound: 'default',
          extra: { route: '/explore' },
        },
      ],
    })
  } catch {}
}
