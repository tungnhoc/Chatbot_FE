import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        // Placeholder endpoint for future STT integration.
        // Expects multipart/form-data with field name "audio".
        // You can pipe this blob to your real STT service later
        // and return its transcript as { text }.

        // Read form data (not used here, but validated for shape)
        const form = await req.formData()
        const audio = form.get("audio") as File | null
        if (!audio) {
            return NextResponse.json({ error: "Missing 'audio' file" }, { status: 400 })
        }

        // Mock processing delay
        await new Promise((r) => setTimeout(r, 400))

        // Mock transcript. Replace with real STT result later.
        return NextResponse.json({ text: "(Giọng nói đã được chuyển thành chữ - mock)" })
    } catch (err) {
        return NextResponse.json({ error: "Speech-to-text failed" }, { status: 500 })
    }
}


