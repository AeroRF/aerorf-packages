export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'export' | 'admin';

export interface UserPermissions {
  modules: string[];
  actions: PermissionAction[];
}

export interface JwtPayload {
  iss: string;
  sub: string;
  exp: number;
  name: string;
  email: string;
  role: string;
  empresaId: string;
  unidadeId: string;
  empresasPermitidas: string[];
  unidadesPermitidas: string[];
  permissions: UserPermissions;
}

export interface AuthSession {
  uid: string;
  email: string;
  nome: string;
  role: string;
  empresaId: string;
  unidadeId: string;
  empresaNome?: string;
  unidadeNome?: string;
  empresasPermitidas: string[];
  unidadesPermitidas: string[];
  modulos: string[];
  permissoes: UserPermissions;
  fullAccess?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  session: AuthSession;
}
