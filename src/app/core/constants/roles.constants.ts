// Role constants — mirror of plotcraft-backend/src/common/constants/roles.ts
export const Role = {
  USER: 10,
  ADMIN: 50,
  MASTER: 100,
} as const;

export type RoleId = (typeof Role)[keyof typeof Role];

export function hasRole(userRole: number, minRole: RoleId): boolean {
  return userRole >= minRole;
}
