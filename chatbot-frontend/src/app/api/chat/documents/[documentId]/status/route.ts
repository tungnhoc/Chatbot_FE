import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { documentId: string } }) {
  const authorization = request.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!/^\d+$/.test(params.documentId)) return NextResponse.json({ error: "Invalid document ID" }, { status: 400 })
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${params.documentId}/status`, {
      method: "GET", headers: { Authorization: authorization }, cache: "no-store"
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: "Document service unavailable" }, { status: 502 })
  }
}
