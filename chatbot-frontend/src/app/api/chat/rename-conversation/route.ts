import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Thiếu hoặc sai token" }, { status: 401 })
    }

    const { conversationId, newTitle } = await request.json()
    if (!conversationId || !String(newTitle).trim()) {
      return NextResponse.json({ error: "Thiếu conversationId hoặc tiêu đề mới" }, { status: 400 })
    }

    const token = authHeader.split(" ")[1]
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const flaskUrl = `${baseUrl}/api/conversations/${encodeURIComponent(conversationId)}`

    const flaskRes = await fetch(flaskUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: String(newTitle).trim() }),
    })

    const data = await flaskRes.json().catch(() => ({}))
    if (!flaskRes.ok) {
      return NextResponse.json({ error: data?.error || "Đổi tên thất bại" }, { status: flaskRes.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("❌ Error renaming conversation:", error)
    return NextResponse.json({ error: "Failed to rename conversation" }, { status: 500 })
  }
}
