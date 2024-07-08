import { useAuth } from '~/store/auth';

const auth = useAuth();

declare global {
  type DirectusSchema = {
    gp_adopted_probes: Probe[];
    gp_credits: Credits[];
    gp_credits_additions: CreditsAddition[];
    gp_credits_deductions: CreditsDeduction[];
    gp_tokens: Token[];

    directus_users: User;
  };

  type Credits = {
    amount: number;
    user_id: string;
  };

  type CreditsAddition = {
    amount: number;
    comment: string;
    date_created: string;
    adopted_probe: number | null;
    github_id: string;
  };

  type CreditsDeduction = {
    amount: number;
    date: string;
    user_id: string;
  };

  type CreditsChange = {
    type: 'addition' | 'deduction';
    date_created: string;
    comment?: string;
    amount: number;
    adopted_probe?: number | null;
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
    appearance: null | 'light' | 'dark';
  };

  type Token = {
    id: number;
    date_created: string;
    date_last_used: string | null;
    date_updated: string | null;
    expire: string | null;
    name: string | null;
    origins: string[];
    value: string;
    user_created: string;
    user_updated: string | null;
  };

  type DashboardError = {
    response?: {
      statusText: string;
    }
    errors?: [{
      message: string;
    }];
    message?: string;
  };
}
