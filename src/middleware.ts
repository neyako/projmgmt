import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const memberBlockedRoutes = ["/analytics", "/sponsorships", "/team"];

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const pathname = req.nextUrl.pathname;

    if (role === "MEMBER" && memberBlockedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
