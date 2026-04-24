export const USER_ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const;
export type UserRole = (typeof USER_ROLES)[number];
