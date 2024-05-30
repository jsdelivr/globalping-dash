import { useAuth } from '~/store/auth';

const auth = useAuth();

declare global {
  type DirectusSchema = {
    gp_adopted_probes: Probe[];

    directus_users: User;
  };

  type Probe = {
    id: string;
    name: string;
  };

  type User = typeof auth.getUser & {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    external_identifier: string | null; // null for non-gh admin
    github_organizations: string[];
    github_username: string | null; // null for non-gh admin
    user_type: 'member' | 'special' | 'sponsor';
  }
}
