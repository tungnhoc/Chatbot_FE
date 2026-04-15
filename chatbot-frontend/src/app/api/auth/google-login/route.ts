import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    // TODO: Replace with your Python API
    // Example: const response = await fetch('http://your-python-api.com/auth/google-login', { ... })

    // Mock response
    const mockUser = {
      id: `google_${Date.now()}`,
      email: `user_${Date.now()}@gmail.com`,
      name: "Google User",
      provider: provider,
    }

    return NextResponse.json(
      {
        success: true,
        user: mockUser,
        token: `mock_token_${Date.now()}`,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Google login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Đăng nhập với Google thất bại",
      },
      { status: 500 },
    )
  }
}
