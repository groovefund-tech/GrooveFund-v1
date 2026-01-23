import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image_base64, file_name } = req.body

    if (!image_base64 || !file_name) {
      return res.status(400).json({ error: 'Missing image_base64 or file_name' })
    }

    // Generate unique filename
    const fileExtension = file_name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`

    // Convert base64 to buffer
    let base64String = image_base64

    // Remove data URI prefix if it exists
    if (base64String.includes(',')) {
      base64String = base64String.split(',')[1]
    }

    const buffer = Buffer.from(base64String, 'base64')

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(uniqueFileName, buffer, {
        contentType: `image/${fileExtension}`,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return res.status(500).json({
        error: `Upload failed: ${uploadError.message}`,
      })
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uniqueFileName)

    const imageUrl = publicData?.publicUrl

    if (!imageUrl) {
      return res.status(500).json({
        error: 'Failed to generate public URL',
      })
    }

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      fileName: uniqueFileName,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error during upload',
    })
  }
}