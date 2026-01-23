import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

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

    // Verify user is admin
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    // Generate unique filename
    const fileExtension = file_name.split('.').pop()
    const uniqueFileName = `blog-images/${uuidv4()}.${fileExtension}`

    // Convert base64 to buffer
    const base64Data = image_base64.replace(/^data:image\\/\\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('blog-images') // Make sure this bucket exists
      .upload(uniqueFileName, buffer, {
        contentType: `image/${fileExtension}`,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` })
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uniqueFileName)

    const imageUrl = publicData?.publicUrl

    if (!imageUrl) {
      return res.status(500).json({ error: 'Failed to generate public URL' })
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