import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getConfiguredPublicAppUrl } from "@/lib/appSettings";
import { prisma } from "@/lib/prisma";
import { type UserRole } from "@/lib/roles";
import bcrypt from "bcrypt";

function normalizeRole(value: string | null | undefined): UserRole {
  return value === "ADMIN" || value === "MANAGER" ? value : "MEMBER";
}

function sameOriginOrNextAuthBase(url: URL, publicBase: URL, nextAuthBase: string) {
  return url.origin === publicBase.origin || url.origin === new URL(nextAuthBase).origin;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
          username: user.username,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const configuredUrl = await getConfiguredPublicAppUrl();
      const publicBase = new URL(configuredUrl || baseUrl);

      if (url.startsWith("/")) {
        return new URL(url, publicBase).toString();
      }

      try {
        const parsedUrl = new URL(url);
        if (sameOriginOrNextAuthBase(parsedUrl, publicBase, baseUrl)) {
          return new URL(
            `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`,
            publicBase
          ).toString();
        }
      } catch {
        return publicBase.toString();
      }

      return publicBase.toString();
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = normalizeRole(user.role);
        token.username = user.username;
        token.avatarUrl = user.avatarUrl;
      }

      if (token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { avatarUrl: true },
        });
        token.avatarUrl = currentUser?.avatarUrl ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = normalizeRole(token.role);
        session.user.username = token.username;
        session.user.avatarUrl = token.avatarUrl;
      }

      return session;
    },
  },
};
