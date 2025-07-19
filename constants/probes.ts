export const OFFLINE_STATUSES: Status[] = [ 'unbuffer-missing', 'sigterm', 'offline' ] as const;
export const ONLINE_STATUSES: Status[] = [ 'initializing', 'ready', 'ping-test-failed' ] as const;
