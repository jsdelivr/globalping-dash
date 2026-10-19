import { customEndpoint } from '@directus/sdk';

export const DESCRIPTION_MAX_LENGTH = 200;

// Same rule as the gp_orgs.website field validation in Directus.
const WEBSITE_PATTERN = /^https:\/\/[^\s/?#.@]+(\.[^\s/?#.@]+)+([/?#]\S*)?$/;

export const isValidWebsite = (website: string) => !website || WEBSITE_PATTERN.test(website);

export const BANNER_TYPES = [ 'image/png', 'image/jpeg', 'image/webp' ];
const BANNER_MIN_WIDTH = 1224;
const BANNER_MIN_HEIGHT = 200;
const BANNER_MAX_MB = 5;

export const BANNER_HINT = [ `Min ${BANNER_MIN_WIDTH}×${BANNER_MIN_HEIGHT} px`, 'png / jpeg / webp', `up to ${BANNER_MAX_MB} MB` ];

// A picked file to upload, null to remove the saved banner, undefined to keep it.
export type BannerChange = File | null | undefined;

const TYPE_ERROR = 'The banner must be a PNG, JPEG or WebP image.';

export const validateBanner = async (file: File) => {
	if (!BANNER_TYPES.includes(file.type)) {
		return TYPE_ERROR;
	}

	if (file.size > BANNER_MAX_MB * 1024 * 1024) {
		return `The banner must be ${BANNER_MAX_MB} MB or smaller.`;
	}

	const bitmap = await createImageBitmap(file).catch(() => null);

	if (!bitmap) {
		return TYPE_ERROR;
	}

	const { width, height } = bitmap;
	bitmap.close();

	return width < BANNER_MIN_WIDTH || height < BANNER_MIN_HEIGHT ? `The banner must be at least ${BANNER_MIN_WIDTH}×${BANNER_MIN_HEIGHT} px.` : null;
};

export const saveBanner = async (directus: ReturnType<typeof useNuxtApp>['$directus'], orgId: string, banner: BannerChange) => {
	if (banner === undefined) {
		return;
	}

	const path = `/organizations/${orgId}/banner`;

	if (banner === null) {
		await directus.request(customEndpoint({ method: 'DELETE', path }));
		return;
	}

	await directus.request(customEndpoint({
		method: 'POST',
		path,
		headers: { 'Content-Type': banner.type },
		onRequest: options => ({ ...options, body: banner }),
	}));
};
