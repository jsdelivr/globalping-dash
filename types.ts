import { useAuth } from '~/store/auth';

const auth = useAuth();

declare global {
  interface Window {
    googleMapsLoadCallback: () => void,
  }

  type DirectusSchema = {
    gp_probes: Probe[];
    gp_credits: Credits[];
    gp_credits_additions: CreditsAddition[];
    gp_credits_deductions: CreditsDeduction[];
    gp_tokens: Token[];
    gp_apps: Application[];
    gp_apps_approvals: AppAppoval[];

    directus_users: User;
  };

  type Credits = {
    amount: number;
    user_id: string;
  };

  type CreditsAddition = {
    amount: number;
    comment: string;
    date_created: 'datetime';
    adopted_probe: string | null;
    github_id: string;
  };

  type CreditsDeduction = {
    amount: number;
    date: 'datetime';
    user_id: string;
  };

  type CreditsChange = {
    type: 'addition' | 'deduction';
    date_created: string;
    comment?: string;
    amount: number;
    adopted_probe?: string | null;
  };

  type Probe = {
    id: string;
    asn: number;
    city: string;
    country: string;
    countryOfCustomCity: string | null;
    date_created: string;
    date_updated: string;
    ip: string;
    altIps: string[];
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
        format?: string;
      }[],
    systemTags: string[],
    userId: string;
    uuid: string;
    version: string;
    hardwareDevice: string | null;
    hardwareDeviceFirmware: string | null;
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
    app_id: string | null;
    scopes: string[];
    type: string;
    parent: number | null;
  };

  type Application = {
    id: string;
    name: string;
    date_last_used: string | null;
    owner_name: string;
    owner_url: string;
  };

  type AppAppoval = {
    id: string;
    date_created: string | null;
    date_updated: string | null;
    user: string;
    app: string;
    scopes: string[];
  }

  type DashboardError = {
    response?: {
      statusText: string;
    }
    errors?: [{
      message: string;
    }];
    message?: string;
  };

  type CodeApprovalDetails = {
    client: {
      name: string;
      owner: {
        name: string | null;
        url: string | null;
      }
    };
  } | null;

  type DirectusNotification = {
    id: string;
    timestamp: string;
    status: 'inbox' | 'archived';
    recipient: string;
    sender: string | null;
    subject: string;
    message: string;
    collection: string;
    item: string;
  };

  type Metadata = {
    targetNodeVersion: string,
    targetHardwareDeviceFirmware: string,
    creditsPerDollar: number,
    creditsPerAdoptedProbe: number,
  }
}
