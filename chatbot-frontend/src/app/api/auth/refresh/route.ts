// src/app/api/auth/refresh/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  let refreshToken: string | undefined = cookies().get("refresh_token")?.value;

  try {
    const body = await request.json();
    if (body.refresh_token) {
      refreshToken = body.refresh_token;
    }
  } catch (e) {
    // Ignore JSON parse error in case it's empty
  }

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token provided" }, { status: 401 });
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({}, { status: 401 });
  }

  const data = await res.json();

  return NextResponse.json({
    access_token: data.access_token,
  });
}
