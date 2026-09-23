export const ROLE_LABEL = {
  COOKER: '做饭的人',
  EATER: '点餐的人',
} as const;

export type AppRole = keyof typeof ROLE_LABEL;

export function otherRole(role: AppRole): AppRole {
  return role === 'COOKER' ? 'EATER' : 'COOKER';
}
