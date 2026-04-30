"use server";

import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import {
  getConfiguredPublicAppUrl,
  getPublicAppUrlFromHeaders,
} from "@/lib/appSettings";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_ROLES, type UserRole } from "@/lib/roles";
import { teamUserSelect } from "@/lib/userSelect";
import type { CredentialHandoff, PublicUser, TeamUser } from "@/types";

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

type TeamUserWithPasswordHash = PublicUser & {
  passwordHash: string | null;
};

type CredentialActionData = {
  user: TeamUser;
  credentials: CredentialHandoff;
};

const PASSWORD_LOWER = "abcdefghijkmnopqrstuvwxyz";
const PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PASSWORD_DIGITS = "23456789";
const PASSWORD_SYMBOLS = "!@#$%^&*";
const PASSWORD_ALPHABET =
  PASSWORD_LOWER + PASSWORD_UPPER + PASSWORD_DIGITS + PASSWORD_SYMBOLS;

function pickChar(alphabet: string) {
  return alphabet[randomInt(0, alphabet.length)];
}

function shuffle(chars: string[]) {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

function generateTemporaryPassword(length = 16) {
  const chars = [
    pickChar(PASSWORD_LOWER),
    pickChar(PASSWORD_UPPER),
    pickChar(PASSWORD_DIGITS),
    pickChar(PASSWORD_SYMBOLS),
  ];

  while (chars.length < length) {
    chars.push(pickChar(PASSWORD_ALPHABET));
  }

  return shuffle(chars).join("");
}

function normalizeRole(role: string): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : "MEMBER";
}

function normalizeUsernameSeed(email: string, name: string) {
  const rawSeed = email.split("@")[0] || name || "member";
  const normalized = rawSeed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);

  return normalized || "member";
}

async function generateUniqueUsername(email: string, name: string, currentUserId?: string) {
  const base = normalizeUsernameSeed(email, name);
  let username = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existing || existing.id === currentUserId) {
      return username;
    }

    const suffixText = `-${suffix}`;
    username = `${base.slice(0, 32 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }
}

function toTeamUser(user: TeamUserWithPasswordHash): TeamUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
    hasLogin: Boolean(user.username && user.passwordHash),
  };
}

async function resolveLoginUrl() {
  const configuredUrl = await getConfiguredPublicAppUrl();
  if (configuredUrl) {
    return new URL("/login", configuredUrl).toString();
  }

  const requestHeaders = await headers();
  const requestUrl = getPublicAppUrlFromHeaders(requestHeaders);
  const fallbackUrl = requestUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return new URL("/login", fallbackUrl).toString();
}

function buildCredentialHandoff(
  user: TeamUser,
  temporaryPassword: string,
  loginUrl: string
): CredentialHandoff {
  const emailSubject = "Your projmgmt login";
  const username = user.username || "";
  const emailBody = [
    `Hi ${user.name},`,
    "",
    "Your projmgmt login is ready.",
    "",
    `Username: ${username}`,
    `Temporary password: ${temporaryPassword}`,
    `Login URL: ${loginUrl}`,
    "",
    "Please change this password after signing in.",
  ].join("\n");

  return {
    email: user.email,
    username,
    temporaryPassword,
    loginUrl,
    emailSubject,
    emailBody,
    emailDeliveryStatus: "pending_integration",
  };
}

async function requireTeamAccess(): Promise<{ success: false; error: string } | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated." };
  }

  if (session.user.role === "MEMBER") {
    return { success: false, error: "Not authorized." };
  }

  return null;
}

function getPrismaErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return "Email or username is already in use.";
  }

  return fallback;
}

export async function createUser(data: {
  name: string;
  email: string;
  role: string;
}): Promise<ActionResult<CredentialActionData>> {
  try {
    const authError = await requireTeamAccess();
    if (authError) return authError;

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();

    if (!name || !email) {
      return { success: false, error: "Name and email are required." };
    }

    const username = await generateUniqueUsername(email, name);
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
        role: normalizeRole(data.role),
      },
      select: teamUserSelect,
    });
    const teamUser = toTeamUser(user);
    const loginUrl = await resolveLoginUrl();

    revalidatePath("/team");
    return {
      success: true,
      data: {
        user: teamUser,
        credentials: buildCredentialHandoff(teamUser, temporaryPassword, loginUrl),
      },
    };
  } catch (err) {
    console.error("[createUser]", err);
    return { success: false, error: getPrismaErrorMessage(err, "Failed to create user.") };
  }
}

export async function updateUser(id: string, data: {
  name?: string;
  email?: string;
  role?: string;
}): Promise<ActionResult<{ user: TeamUser }>> {
  try {
    const authError = await requireTeamAccess();
    if (authError) return authError;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
        ...(data.role !== undefined && { role: normalizeRole(data.role) }),
      },
      select: teamUserSelect,
    });
    revalidatePath("/team");
    return { success: true, data: { user: toTeamUser(user) } };
  } catch (err) {
    console.error("[updateUser]", err);
    return { success: false, error: getPrismaErrorMessage(err, "Failed to update user.") };
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const authError = await requireTeamAccess();
    if (authError) return authError;

    await prisma.user.delete({ where: { id } });
    revalidatePath("/team");
    return { success: true, data: null };
  } catch (err) {
    console.error("[deleteUser]", err);
    return { success: false, error: "Failed to delete user." };
  }
}

export async function resetUserCredentials(
  id: string
): Promise<ActionResult<CredentialActionData>> {
  try {
    const authError = await requireTeamAccess();
    if (authError) return authError;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Member not found." };
    }

    const username =
      existing.username?.trim() ||
      (await generateUniqueUsername(existing.email, existing.name, existing.id));
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        username,
        passwordHash,
      },
      select: teamUserSelect,
    });
    const teamUser = toTeamUser(updated);
    const loginUrl = await resolveLoginUrl();

    revalidatePath("/team");
    return {
      success: true,
      data: {
        user: teamUser,
        credentials: buildCredentialHandoff(teamUser, temporaryPassword, loginUrl),
      },
    };
  } catch (err) {
    console.error("[resetUserCredentials]", err);
    return {
      success: false,
      error: getPrismaErrorMessage(err, "Failed to reset credentials."),
    };
  }
}
