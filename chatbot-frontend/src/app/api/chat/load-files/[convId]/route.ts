import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: { convId: string } }) {
    try {
        const { convId } = context.params
        const authHeader = request.headers.get("Authorization")

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Thiếu hoặc sai token" }, { status: 401 })
        }

        const token = authHeader.split(" ")[1]
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const flaskUrl = `${baseUrl}/api/chat/conversations/${convId}/files`

        const flaskRes = await fetch(flaskUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })

        const data = await flaskRes.json()

        if (!flaskRes.ok) {
            return NextResponse.json(
                { error: data?.error || "Failed to fetch conversation files" },
                { status: flaskRes.status },
            )
        }

        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("❌ Error fetching conversation files:", error)
        return NextResponse.json({ error: "Failed to fetch conversation files" }, { status: 500 })
    }
}
