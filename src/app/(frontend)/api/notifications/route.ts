import { NextRequest, NextResponse } from 'next/server'
import webpush, { type PushSubscription } from 'web-push' // Import type for clarity
import { getPayload } from 'payload'
import config from '@payload-config'

// Ensure environment variables are loaded (especially in development)
// In production environments (like Vercel), these should be set in the project settings.

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
console.log(vapidPrivateKey)
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

// --- Subscription Storage (In-Memory Example) ---
// !! IMPORTANT !!: In a real application, you MUST store subscriptions
// in a persistent database (e.g., PostgreSQL, MongoDB, Firestore, etc.).
// This in-memory array will be lost when the server restarts.
//let subscriptions: PushSubscription[] = []
// -------------------------------------------------

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
    console.log('Subscription data:', subscription)
    // Basic validation (add more robust checks as needed)
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object received.' }, { status: 400 })
    }

    // Avoid adding duplicate subscriptions (simple check)
    //TODO:
    //const existingSubscription = subscriptions.find((s) => s.endpoint === subscription.endpoint)

    if (!existingSubscription) {
      const payload = await getPayload({ config })
      const post = await payload.create({
        collection: 'subscriptions', // required
        data: {
          // required
          subscription: JSON.stringify(subscription),
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
export async function GET(request: NextRequest) {
  // Check if VAPID keys were successfully configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured on the server.' }, { status: 500 })
  }
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'subscriptions', // required
    pagination: false, // If you want to disable pagination count, etc.
  })
  const subscriptions = result.docs.map((doc) => JSON.parse(doc.subscription))
  console.log(subscriptions)
  if (subscriptions.length === 0) {
    console.log('No subscriptions to send notifications to.')
    return NextResponse.json({ message: 'No active subscriptions found.' })
  }

  console.log(`Attempting to send notifications to ${subscriptions.length} subscriptions.`)

  const notificationPayload = JSON.stringify({
    title: 'Web Push Test',
    body: 'This notification was pushed by the server!',
    icon: '/icon-192x192.png', // Optional: Ensure this icon exists in your /public folder
    // You can add more options like 'data', 'actions', etc.
  })

  const sendPromises = subscriptions.map((subscription) =>
    webpush.sendNotification(subscription, notificationPayload).catch((error) => {
      // Handle errors, especially 'Gone' (410) or 'Not Found' (404)
      // which indicate the subscription is no longer valid.
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Subscription ${subscription.endpoint} is gone. Removing.`)
        // TODO: Remove this subscription from your database
        // Skal have id med (har det ikke i subscriptions objektet)
        subscriptions = subscriptions.filter((s) => s.endpoint !== subscription.endpoint)
      } else {
        console.error(
          `Failed to send notification to ${subscription.endpoint}:`,
          error.statusCode,
          error.body,
        )
      }
      // Return null or a specific error object for Promise.allSettled
      return { endpoint: subscription.endpoint, error: error }
    }),
  )

  // Use Promise.allSettled to wait for all sends, even if some fail
  const results = await Promise.allSettled(sendPromises)

  let successCount = 0
  let failureCount = 0
  results.forEach((result) => {
    if (result.status === 'fulfilled' && !result.value?.error) {
      successCount++
    } else {
      failureCount++
      // Log detailed failure info if needed (already logged in catch block above)
      // console.error("Failed push:", result.reason || result.value?.error);
    }
  })

  console.log(`Notification sending complete. Success: ${successCount}, Failures: ${failureCount}`)

  return NextResponse.json({
    message: `Notifications sent. Success: ${successCount}, Failures: ${failureCount}`,
    totalSubscriptionsAttempted: subscriptions.length + failureCount, // Reflects original count before potential removals
  })
}
