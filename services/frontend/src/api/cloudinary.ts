const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const paramsToSign = `folder=avatars&timestamp=${timestamp}`
  const signature = await sha1(`${paramsToSign}${API_SECRET}`)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', API_KEY)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('folder', 'avatars')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Upload failed')

  const data = await res.json()
  return data.secure_url as string
}
