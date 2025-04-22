import { NextRequest, NextResponse } from 'next/server'
import webpush, { type PushSubscription } from 'web-push' // Import type for clarity
import { getPayload } from 'payload'
import config from '@payload-config'

// Ensure environment variables are loaded (especially in development)
// In production environments (like Vercel), these should be set in the project settings.

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

// Basic validation for VAPID keys
if (!vapidPublicKey || !vapidPrivateKey) {
  console.error(
    'VAPID keys are missing. Ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set in your environment variables.',
  )
  // Optionally throw an error during build or startup in development
  // throw new Error("VAPID keys are not configured.");
} else {
  try {
    webpush.setVapidDetails(
      'mailto:your-email@example.com', // Replace with your contact email
      vapidPublicKey,
      vapidPrivateKey,
    )
  } catch (error) {
    console.error('Error setting VAPID details:', error)
    // Handle initialization error appropriately
  }
}

/**
 * POST handler to save a new push subscription received from the client.
 */
export async function POST(request: NextRequest) {
  // Check if VAPID keys were successfully configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured on the server.' }, { status: 500 })
  }

  try {
    const subscription = (await request.json()) as PushSubscription
    // Basic validation (add more robust checks as needed)
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object received.' }, { status: 400 })
    }

    // Avoid adding duplicate subscriptions (simple check)
    //TODO:
    const payload = await getPayload({ config })
    const existingSubscription = await payload.find({
      collection: 'subscriptions', // required
      where: {
        endpoint: {
          equals: subscription.endpoint,
        },
      },
    })
    //const existingSubscription = subscriptions.find((s) => s.endpoint === subscription.endpoint)

    if (existingSubscription.docs.length === 0) {
      await payload.create({
        collection: 'subscriptions', // required
        data: {
          // required
          subscription: JSON.stringify(subscription),
          endpoint: subscription.endpoint,
        },
      })
      console.log('Subscription added:', subscription.endpoint)
      // TODO: Persist subscription to your database here
    } else {
      console.log('Subscription already exists:', subscription.endpoint)
      // Optionally update the existing subscription if keys changed
    }

    return NextResponse.json({ message: 'Subscription saved successfully.' }, { status: 201 })
  } catch (error) {
    console.error('Error processing subscription POST request:', error)
    // Check for specific error types if needed
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to save subscription.' }, { status: 500 })
  }
}

/**
 * GET handler (for demonstration) to trigger sending a notification
 * to all stored subscriptions. In a real app, this trigger might come
 * from another backend service, a cron job, or an admin action.
 */
function formatDateInTimeZone(date: Date, timeZone = 'Europe/Copenhagen') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}
function formatTimeInTimeZone(date: Date, timeZone = 'Europe/Copenhagen') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
  })
  return formatter.format(date)
}

export async function GET(_request: NextRequest) {
  // Check if VAPID keys were successfully configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured on the server.' }, { status: 500 })
  }
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'subscriptions', // required
    pagination: false, // If you want to disable pagination count, etc.
  })
  const subscriptions = result.docs //.map((doc) => JSON.parse(doc.subscription))
  if (subscriptions.length === 0) {
    console.log('No subscriptions to send notifications to.')
    return NextResponse.json({ message: 'No active subscriptions found.' })
  }

  console.log(`Attempting to send notifications to ${subscriptions.length} subscriptions.`)
  const date = formatDateInTimeZone(new Date())
  const rawTime = formatTimeInTimeZone(new Date())
  const rawTimePostFixed = formatTimeInTimeZone(new Date()) + ':00'
  const relevantSlot = await payload.find({
    collection: 'energy_slots',
    where: {
      date: {
        equals: date,
      },
      time: {
        equals: rawTimePostFixed,
      },
    },
  })

  const id = relevantSlot.docs[0].id
  const notificationPayload = JSON.stringify({
    title: 'Tid til at registrere!',
    body: `Så er det tid til at registrere for perioden ${rawTimePostFixed} - ${(Number(rawTime) + 1).toString().padStart(2, '0')}:00`,
    icon: '/web-app-manifest-192x192.png', // Optional: Ensure this icon exists in your /public folder
    // You can add more options like 'data', 'actions', etc.
    data: {
      url: '/slot/' + id, // Optional: URL to open when notification is clicked
    },
  })

  const sendPromises = subscriptions.map((subscriptionObj) => {
    const subscription = JSON.parse(subscriptionObj.subscription)
    webpush.sendNotification(subscription, notificationPayload).catch((error) => {
      // Handle errors, especially 'Gone' (410) or 'Not Found' (404)
      // which indicate the subscription is no longer valid.
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Subscription ${subscription.endpoint} is gone. Removing.`)
        // TODO: Remove this subscription from your database
        // Skal have id med (har det ikke i subscriptions objektet)
        //subscriptions = subscriptions.filter((s) => s.endpoint !== subscription.endpoint)
        payload.delete({
          collection: 'subscriptions', // required
          id: subscriptionObj.id, // required
        })
      } else {
        console.error(
          `Failed to send notification to ${subscription.endpoint}:`,
          error.statusCode,
          error.body,
        )
      }
      // Return null or a specific error object for Promise.allSettled
      return { endpoint: subscription.endpoint, error: error }
    })
  })

  // Use Promise.allSettled to wait for all sends, even if some fail
  const results = await Promise.allSettled(sendPromises)

  let successCount = 0
  let failureCount = 0
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      // && !result.value?.error) {
      successCount++
    } else {
      failureCount++
    }
  })

  console.log(`Notification sending complete. Success: ${successCount}, Failures: ${failureCount}`)

  return NextResponse.json({
    message: `Notifications sent. Success: ${successCount}, Failures: ${failureCount}`,
    totalSubscriptionsAttempted: subscriptions.length + failureCount, // Reflects original count before potential removals
  })
}
