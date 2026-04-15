import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { conversationId: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Thiếu hoặc sai token" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const conversationId = params.conversationId

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const description = formData.get("description") || "pdf"

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Không có file nào được chọn" }, { status: 400 })
    }

    // Gửi sang Flask backend
    const pythonForm = new FormData()
    files.forEach((file) => pythonForm.append("files", file))
    pythonForm.append("description", description as string)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload_pdf/${conversationId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: pythonForm,
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Upload thất bại" },
        { status: res.status }
      )
    }

    const documentIds = (data.results || [])
      .filter((r: any) => r.success)
      .map((r: any) => r.document_id)

    return NextResponse.json({
      success: true,
      conversationId,
      uploaded: data.results || [],
      totalFiles: files.length,
      documentIds,
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    )
  }
}
