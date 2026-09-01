import { NextResponse } from "next/server";

// POST: Verify PIN and set HTTP-only cookie
export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const serverPin = process.env.ADMIN_SECURITY_PIN || "2540";

    if (!pin || pin !== serverPin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Set secure HTTP-only cookie (cannot be accessed by client JS)
    response.cookies.set("elim_admin_token", "authorized_session_es_2026", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}

// GET: Check active session status
export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const isAuthenticated = cookieHeader.includes("elim_admin_token=authorized_session_es_2026");
  return NextResponse.json({ authenticated: isAuthenticated });
}

// DELETE: Clear session cookie on logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("elim_admin_token");
  return response;
}