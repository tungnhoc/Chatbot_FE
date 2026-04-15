import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: { convId: string } }) {
    try {
        const { convId } = context.params
        const url = new URL(request.url)
        const limit = url.searchParams.get("limit") ?? "20"
        const offset = url.searchParams.get("offset") ?? "0"

        const authHeader = request.headers.get("Authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Thiếu hoặc sai token" }, { status: 401 })
        }

        const token = authHeader.split(" ")[1]
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const flaskUrl = `${baseUrl}/api/conversations/${encodeURIComponent(
            convId
        )}/history?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`;

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
                { error: data?.error || "Failed to fetch conversation history" },
                { status: flaskRes.status },
            )
        }

        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("❌ Error fetching conversation history:", error)
        return NextResponse.json({ error: "Failed to fetch conversation history" }, { status: 500 })
    }
}


