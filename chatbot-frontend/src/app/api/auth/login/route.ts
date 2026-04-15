export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 🔗 Gọi API Flask thật (đổi localhost:5000 thành URL backend của bạn)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    // ⚠️ Nếu Flask trả lỗi
    if (!response.ok) {
      const errorData = await response.json()
      return Response.json({ error: errorData.error || "Đăng nhập thất bại" }, { status: response.status })
    }

    // ✅ Nếu thành công
    const data = await response.json()

    // Bạn có thể lưu token vào cookie nếu muốn
    return Response.json({
      message: data.message,
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
  } catch (error) {
    console.error("Login API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
