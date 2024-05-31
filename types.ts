import { useAuth } from '~/store/auth';

const auth = useAuth();

declare global {
  type DirectusSchema = {
    gp_adopted_probes: Probe[];
    gp_credits: Credits[];
    gp_credits_additions: CreditsAddition[];

    directus_users: User;
  };

  type Credits = {
    id: number;
    amount: number;
    user_id: string;
  };

  type CreditsAddition = {
    id: number;
    amount: number;
    comment: string;
    date_created: string;
    github_id: string;
    adopted_probe: number | null;
  };

  type Probe = {
    id: number;
    asn: number;
    city: string;
    country: string;
    countryOfCustomCity: string | null;
    date_created: string;
    date_updated: string;
    ip: string;
    isCustomCity: boolean;
    lastSyncDate: string;
    latitude: number;
    longitude: number;
    name: string | null;
    network: string;
    onlineTimesToday: number,
    state: string | null,
    status: 'initializing' | 'ready' | 'unbuffer-missing' | 'ping-test-failed' | 'sigterm';
    tags: {
        value: string;
        prefix: string;
      }[],
    userId: string;
    uuid: string;
    version: string;
    hardwareDevice: string | null;
    nodeVersion: string;
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
