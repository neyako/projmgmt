import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const memberBlockedRoutes = ["/analytics", "/sponsorships", "/team"];

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/avatars/")) {
      const filename = pathname.slice("/avatars/".length);
      return NextResponse.rewrite(
        new URL(`/api/avatars/${filename}`, req.url)
      );
    }

    const role = req.nextauth.token?.role;

    if (role === "MEMBER" && memberBlockedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/avatars/")) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|setup).*)"],
};
