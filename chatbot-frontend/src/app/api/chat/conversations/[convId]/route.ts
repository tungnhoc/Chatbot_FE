import { NextResponse } from "next/server"

export async function DELETE(request: Request, context: { params: { convId: string } }) {
    try {
        const { convId } = context.params
        const authHeader = request.headers.get("Authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Thiếu hoặc sai token" }, { status: 401 })
        }

        const token = authHeader.split(" ")[1]
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const flaskUrl = `${baseUrl}/api/conversations/${encodeURIComponent(convId)}`
        const flaskRes = await fetch(flaskUrl, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })

        const data = await flaskRes.json().catch(() => ({}))
        if (!flaskRes.ok) {
            return NextResponse.json({ error: data?.error || "Failed to delete conversation" }, { status: flaskRes.status })
        }

        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("❌ Error deleting conversation:", error)
        return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
    }
}


