import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Thiếu hoặc sai token" },
        { status: 401 }
      );
    }

    // đọc body từ FE
    const body = await request.json();
    const {
      conversationId,
      message,
      documentIds = [],
      title = "New chat",
    } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    // gọi API Flask của bạn
    const flaskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        query_text: message,
        conversation_id: conversationId,
        document_ids: documentIds,
        title: title,
      }),
    });

    const data = await flaskResponse.json();

    // Flask báo lỗi → trả ra FE
    if (!flaskResponse.ok) {
      return NextResponse.json(
        { error: data.error || "Python API error" },
        { status: flaskResponse.status }
      );
    }

    // Trả về đúng format FE mong muốn
    return NextResponse.json({
      conversationId: data.conversation_id,
      response: data.response,
    });

  } catch (error: any) {
    console.error("❌ ERROR send-message:", error);
    const errMsg = error?.cause?.code === "ECONNREFUSED" || error?.message?.includes("getaddrinfo")
      ? "Không thể kết nối Flask server. Hãy chắc chắn Flask đang chạy tại http://127.0.0.1:5000"
      : error?.message || "Failed to send message";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
