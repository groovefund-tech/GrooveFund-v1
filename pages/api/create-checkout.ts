import type { NextApiRequest, NextApiResponse } from 'next'

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!YOCO_SECRET_KEY) {
      console.error('❌ YOCO_SECRET_KEY missing')
      return res.status(500).json({ error: 'Payment config error' })
    }

    const { amount, user_id } = req.body

    if (!amount || amount <= 0 || !user_id) {
      return res.status(400).json({ error: 'Invalid request' })
   }


    const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: 'ZAR',
        successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-verify`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        metadata: {
          user_id, //REQUIRED
          source: 'groovefund_topup', // OPTIONAL
        },
      reference: `GROOVE-${user_id}`, // Add this line 
      }),
    })

    const checkout = await yocoRes.json()

    if (!yocoRes.ok) {
      console.error('❌ YOCO ERROR:', checkout)
      return res.status(500).json(checkout)
    }

    return res.status(200).json({ 
      checkoutUrl: checkout.redirectUrl ?? checkout.url,
      checkoutId: checkout.id, // Add this line
    })
  } catch (err) {
    console.error('🔥 create-checkout crash:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
