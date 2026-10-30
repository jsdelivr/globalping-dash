<template>
	<label :for="`${idPrefix}-website`" class="flex items-center font-bold">
		Website URL <i v-tooltip.top="PUBLIC_HINT" class="pi pi-info-circle ml-2"/>
	</label>
	<InputText
		:id="`${idPrefix}-website`"
		v-model.trim="website"
		placeholder="https://example.com"
		class="mt-2 w-full"
		:invalid="showWebsiteError"
		:disabled="disabled"
		@blur="websiteTouched = true"
	/>
	<p v-if="showWebsiteError" class="mt-1 text-sm text-red-500">{{ website.startsWith('http://') ? 'The URL must start with https://' : 'Enter a full URL, e.g. https://example.com' }}</p>

	<label :for="`${idPrefix}-description`" class="mt-6 flex items-center font-bold">
		Description <i v-tooltip.top="PUBLIC_HINT" class="pi pi-info-circle ml-2"/>
	</label>
	<Textarea
		:id="`${idPrefix}-description`"
		v-model="description"
		:maxlength="DESCRIPTION_MAX_LENGTH"
		rows="3"
		auto-resize
		class="mt-2 w-full resize-none"
		:disabled="disabled"
	/>
	<p
		class="mt-1 text-right text-sm"
		:class="{ 'text-red-500': description.length >= DESCRIPTION_MAX_LENGTH }"
	>
		{{ description.length }}/{{ DESCRIPTION_MAX_LENGTH }}
	</p>

	<div class="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
		<p class="flex items-center font-bold">
			<span :id="`${idPrefix}-banner-title`">Upload banner</span>
			<i v-tooltip.top="PUBLIC_HINT" class="pi pi-info-circle ml-2"/>
		</p>
		<p :id="`${idPrefix}-banner-hint`" class="text-sm text-bluegray-500 dark:text-bluegray-300">
			<template v-for="(part, index) in BANNER_HINT" :key="part">
				<template v-if="index"> | </template><span class="whitespace-nowrap">{{ part }}</span>
			</template>
		</p>
	</div>
	<div
		role="group"
		:aria-labelledby="`${idPrefix}-banner-title`"
		class="mt-2 flex items-center gap-4 rounded-xl border p-3 max-sm:flex-col max-sm:items-stretch dark:border-dark-600"
	>
		<div class="aspect-[1224/200] min-w-0 overflow-hidden rounded-md border border-surface-200 bg-gradient-to-r from-surface-50 to-surface-100 max-sm:w-full sm:flex-1 dark:border-dark-600 dark:from-dark-700 dark:to-dark-600">
			<img v-if="previewUrl && !previewFailed" :src="previewUrl" alt="Banner preview" class="size-full object-cover" @error="previewFailed = true">
			<div v-else class="flex size-full items-center justify-center gap-2 text-bluegray-400 dark:text-bluegray-300">
				<i class="pi pi-image text-xl" aria-hidden="true"/>
				<span class="text-sm">{{ previewUrl ? 'Couldn\'t load the banner' : 'No banner' }}</span>
			</div>
		</div>
		<div class="flex shrink-0 items-center justify-end gap-2 sm:w-52">
			<Button
				v-if="previewUrl"
				label="Remove"
				aria-label="Remove banner"
				severity="secondary"
				text
				class="max-sm:flex-1"
				:disabled="disabled"
				:aria-describedby="`${idPrefix}-banner-hint ${idPrefix}-banner-error`"
				@click="removeBanner"
			/>
			<Button
				:label="previewUrl ? 'Replace' : 'Upload image'"
				:aria-label="previewUrl ? 'Replace banner' : undefined"
				icon="pi pi-upload"
				severity="contrast"
				class="max-sm:flex-1 max-sm:[&>[data-pc-section=label]]:flex-none"
				:disabled="disabled"
				:aria-describedby="`${idPrefix}-banner-hint ${idPrefix}-banner-error`"
				@click="fileInput?.click()"
			/>
		</div>
		<input
			:id="`${idPrefix}-banner`"
			ref="fileInput"
			type="file"
			aria-label="Banner file"
			:accept="BANNER_TYPES.join(',')"
			:disabled="disabled"
			class="hidden"
			@change="pickBanner"
		>
	</div>
	<p v-if="banner !== undefined" class="mt-1 text-sm text-bluegray-500 dark:text-bluegray-300">
		{{ banner ? 'New image, applied when you save' : 'The banner will be removed when you save' }}
		<span class="whitespace-nowrap">·&nbsp;<button
			type="button"
			class="font-semibold text-primary hover:underline focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-60"
			:disabled="disabled"
			@click="undoBanner"
		>Undo</button>
		</span>
	</p>
	<p :id="`${idPrefix}-banner-error`" role="alert" class="text-sm text-red-500" :class="{ 'mt-1': bannerError }">{{ bannerError }}</p>
</template>

<script setup lang="ts">
	import { BANNER_HINT, BANNER_TYPES, type BannerChange, DESCRIPTION_MAX_LENGTH, isValidWebsite, validateBanner } from '~/utils/org-profile';

	const PUBLIC_HINT = 'Shown on the organization\'s public page.';

	const props = defineProps<{ idPrefix: string; bannerId?: string | null; disabled?: boolean }>();

	const website = defineModel<string>('website', { required: true });
	const description = defineModel<string>('description', { required: true });
	const banner = defineModel<BannerChange>('banner');

	// The URL is checked once the field was left, and live after that.
	const websiteTouched = ref(false);
	const showWebsiteError = computed(() => websiteTouched.value && !isValidWebsite(website.value));

	// BANNER

	const { directusUrl } = useRuntimeConfig().public;
	const fileInput = ref<HTMLInputElement>();
	const bannerError = ref<string | null>(null);

	const stagedUrl = computed(() => banner.value ? URL.createObjectURL(banner.value) : null);
	watch(stagedUrl, (_url, previous) => previous && URL.revokeObjectURL(previous));
	onBeforeUnmount(() => stagedUrl.value && URL.revokeObjectURL(stagedUrl.value));

	const previewUrl = computed(() => {
		if (banner.value !== undefined) {
			return stagedUrl.value;
		}

		return props.bannerId ? `${directusUrl}/assets/${props.bannerId}?key=banner` : null;
	});

	const previewFailed = ref(false);
	watch(previewUrl, () => previewFailed.value = false);

	const pickBanner = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';

		if (!file) {
			return;
		}

		bannerError.value = await validateBanner(file);

		if (!bannerError.value) {
			banner.value = file;
		}
	};

	const removeBanner = () => {
		bannerError.value = null;
		banner.value = props.bannerId ? null : undefined;
	};

	const undoBanner = () => {
		bannerError.value = null;
		banner.value = undefined;
	};
</script>
