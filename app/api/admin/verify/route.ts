import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || body.password !== adminPassword) {
    // Delay artificial para dificultar ataques de fuerza bruta
    await new Promise((r) => setTimeout(r, 500))
    return NextResponse.json({ success: false, error: 'Contraseña incorrecta.' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
