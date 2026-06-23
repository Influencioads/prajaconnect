export interface UserPermission {
  module: string;
  accessLevel: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  roleLabel: string;
  rank: number;
  language: string;
  designation?: string | null;
  photo?: string | null;
  constituencyId?: string | null;
  mandalId?: string | null;
  permissions: UserPermission[];
}
