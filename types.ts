declare global {
	interface Window {
		googleMapsLoadCallback: () => void;
	}

	type DirectusSchema = {
		'gp_probes': Probe[];
		'gp_credits': Credits[];
		'gp_credits_additions': CreditsAddition[];
		'gp_credits_deductions': CreditsDeduction[];
		'gp_tokens': Token[];
		'gp_apps': Application[];
		'gp_apps_approvals': AppAppoval[];

		'directus_users': User;
		'city-autocomplete': City[];
	};

	type City<TCountry extends string = string> = {
		name: string;
		country: TCountry;
		state: TCountry extends 'US' ? string | null : null;
		stateName: TCountry extends 'US' ? string | null : null;
		customLocation: CustomLocation;
	};

	type Credits = {
		amount: number;
		user_id: string;
	};

	type CreditsAddition = {
		amount: number;
		date_created: 'datetime';
		github_id: string;
		adopted_probe: string | null;
	} & (CreditsAdditionMeta | {
		reason: 'adopted_probe';
		meta: {
			id: string;
			name: string;
			ip: string;
		};
	});

	type CreditsDeduction = {
		amount: number;
		date: 'datetime';
		user_id: string;
	};

	type CreditsChange = {
		type: 'addition';
		date_created: string;
		amount: number;
	} & (CreditsAdditionMeta | {
		reason: 'adopted_probe';
		meta: null;
	}) | {
		type: 'deduction';
		date_created: string;
		amount: number;
		reason: null;
		meta: null;
	};

	type CreditsAdditionMeta = {
		reason: 'one_time_sponsorship' | 'recurring_sponsorship' | 'tier_changed';
		meta: {
			amountInDollars: number;
		};
	} | {
		reason: 'other';
		meta: {
			comment: string;
		};
	};

	type Status = 'initializing' | 'ready' | 'unbuffer-missing' | 'ping-test-failed' | 'sigterm' | 'offline';

	type CustomLocation<TCountry extends string = string> = null | {
		country: string;
		city: string;
		state: TCountry extends 'US' ? string : null;
		longitude: number;
		latitude: number;
	};

	type Probe<TCountry extends string = string> = {
		id: string;
		asn: number;
		city: string;
		country: TCountry;
		state: TCountry extends 'US' ? string | null : null;
		stateName: TCountry extends 'US' ? string | null : null;
		date_created: string;
		date_updated: string;
		ip: string;
		altIps: string[];
		lastSyncDate: string;
		latitude: number;
		longitude: number;
		name: string | null;
		network: string;
		onlineTimesToday: number;
		status: Status;
		tags: {
			value: string;
			prefix: string;
			format?: string;
		}[];
		systemTags: string[];
		userId: string | null;
		uuid: string;
		version: string;
		hardwareDevice: string | null;
		hardwareDeviceFirmware: string | null;
		nodeVersion: string;
		allowedCountries: string[];
		searchIndex: string;
		isOutdated: boolean;
		customLocation: CustomLocation;
	};

	type User = {
		id: string;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		external_identifier: string | null; // null for non-gh admin
		github_username: string | null; // null for non-gh admin
		github_organizations: string[];
		user_type: 'member' | 'special' | 'sponsor';
		appearance: null | 'light' | 'dark';
		public_probes: boolean;
		adoption_token: string;
		default_prefix: string;
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
		user_id: string;
	};

	type AppAppoval = {
		id: string;
		date_created: string | null;
		date_updated: string | null;
		user: string;
		app: string;
		scopes: string[];
	};

	type DashboardError = {
		response?: {
			statusText: string;
			status: number;
		};
		errors?: [ {
			message: string;
		} ];
		message?: string;
	};

	type CodeApprovalDetails = {
		client: {
			name: string;
			owner: {
				name: string | null;
				url: string | null;
			};
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
		targetNodeVersion: string;
		targetHardwareDeviceFirmware: string;
		creditsPerDollar: number;
		creditsPerAdoptedProbe: number;
	};
}
