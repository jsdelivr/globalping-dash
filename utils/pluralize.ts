export function pluralize(singular: string, count: number): string;
export function pluralize(singular: string, plural: string, count: number): string;

export function pluralize (singular: string, arg2: unknown, arg3?: unknown): string {
	const count = arg3 ?? arg2;
	const plural = arg3 ? arg2 as string : singular + 's';

	return count === 1 ? singular : plural;
}
