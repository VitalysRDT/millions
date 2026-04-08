import { NextRequest, NextResponse } from "next/server";

// Lightweight middleware: only used for path-based logic.
// (Auth verification happens in route handlers because middleware
// runs in Edge runtime and can't import Node crypto easily here.)
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next|favicon.svg|images|sounds).*)"],
};
