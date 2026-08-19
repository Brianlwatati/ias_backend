export interface AccessTokenPayload {
  sub: string;
  roleName: string;
  companyId: string;
  roleCode: string;
  roleScope: string;
  roleScopeKey: string;
}

export interface AccessTokenUser {
  userId: number;
  companyId: number;
  roleName: string;
  roleCode: string;
  roleScope: string;
  roleScopeKey: string;
}
