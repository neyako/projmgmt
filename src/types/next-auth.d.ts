import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

type AppUserRole = "ADMIN" | "MANAGER" | "MEMBER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      username?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: AppUserRole;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: AppUserRole;
    username?: string | null;
  }
}
