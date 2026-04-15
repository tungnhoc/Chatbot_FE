export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }
    const token = authHeader.substring(7); 

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
