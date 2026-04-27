import type { Prisma } from "@prisma/client";

export const projectUserSelect = {
  id: true,
  name: true,
  role: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export const publicUserSelect = {
  ...projectUserSelect,
  email: true,
  username: true,
} satisfies Prisma.UserSelect;

export const teamUserSelect = {
  ...publicUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;
