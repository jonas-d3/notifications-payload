import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  fields: [
    {
      name: 'subscription',
      type: 'text',
      required: true,
    },
  ],
}

/* {
    endpoint: 'https://fcm.googleapis.com/fcm/send/cFtXH4xzjZY:APA91bGHEPq30kZdpd24i49a64MCvj3-AFFuNtjNAtAxwOjA_JlzMOQYIwhn9a7P6SkLaoiIYZ784dHD4ejcHAjIE0jFUwWWg4ulxc53uSC1Y3gb7V1asIu7l5ZsBuV2pqAjfknp5uAr',
    expirationTime: null,
    keys: {
      p256dh: 'BGFTfU_9b_xQTArW0h1kdoVVAc6qxNUeOq9NJh2beTdkj3R5tThXi7p76DZyKV5p18VSgxUaHCdiMIzNj9pa8Ws',
      auth: 'SRIWExoKNwU1CaTbFcktoA'
    }
  } */
