<template>
	<GPDialog
		v-model:visible="probeDetailsDialog"
		position="center"
		header="Probe details"
		content-class="!p-0"
		@after-hide="emit('hide')"
	>
		<div class="relative border-y">
			<div class="flex flex-wrap justify-between gap-4 border-b px-6 py-2">
				<div>
					Status:<span class="ml-2 font-bold">{{ capitalize(getProbeStatus(probe).replaceAll('-', ' ')) }}</span>
					<StatusIcon class="ml-2 text-3xs" :status="getProbeStatus(probe)"/>
				</div>
				<div class="flex items-center">
					Credits per month:
					<nuxt-icon class="ml-2 text-green-500" name="coin"/>
					<span class="ml-2 font-bold text-green-500">+{{ props.credits }}</span>
				</div>
				<div>Type:<span class="ml-2 font-bold">{{ probe.hardwareDevice || 'Container' }}</span></div>
				<div>Version:<span class="ml-2 font-bold">{{ probe.version }}</span></div>
			</div>
			<div id="gp-map" class="h-48"/>
		</div>

		<div class="px-6 py-7 dark:text-surface-0">
			<label for="probeName" class="text-xs">Probe name</label>
			<InputText
				id="probeName"
				v-model="probe.name"
				class="mt-1 w-full"
			/>
			<p class="mt-2 text-xs text-bluegray-400">
				Private name of the probe, visible only to you.
			</p>

			<label for="primary-ip" class="mt-4 inline-block text-xs">{{ probe.altIps.length ? 'Primary IP' : 'IP address' }}</label>
			<div class="relative mt-1">
				<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
				<InputText
					id="primary-ip"
					v-model="probe.ip"
					disabled
					class="pointer-events-auto w-full cursor-text select-auto bg-transparent dark:bg-transparent"
				/>
			</div>
			<p class="mt-2 text-xs text-bluegray-400">
				The IP address from which the probe connected.
			</p>

			<div v-if="probe.altIps.length">
				<label for="alternative-ips" class="mt-4 inline-block text-xs">Alternative IPs</label>
				<div class="relative mt-1">
					<i class="pi pi-lock absolute right-3 top-[13px] text-bluegray-500"/>
					<ReadOnlyAutoComplete
						id="alternative-ips"
						v-model="probe.altIps"
					/>
				</div>
				<p class="mt-2 text-xs text-bluegray-400">
					Additional public IP addresses reported by the probe.
				</p>
			</div>

			<label for="city" class="mt-4 inline-block text-xs">Location</label>
			<InputGroup class="mt-1">
				<InputGroupAddon class="!bg-transparent">
					<CountryFlag :country="probe.country" size="small"/>
				</InputGroupAddon>
				<InputText
					id="city"
					v-model="probe.city"
					class="w-full"
				/>
			</InputGroup>
			<p class="mt-2 text-xs text-bluegray-400">
				City where the probe is located. If the auto-detected value is wrong, you can adjust it here.
			</p>

			<label for="systemTags" class="mt-4 inline-block text-xs">System tags</label>
			<div class="relative mt-1">
				<i class="pi pi-lock absolute right-3 top-[13px] text-bluegray-500"/>
				<ReadOnlyAutoComplete
					id="systemTags"
					v-model="probe.systemTags"
				/>
			</div>
			<p class="mt-2 text-xs text-bluegray-400">
				Public tags that can be used to target the probe in measurements.
			</p>

			<label for="userTags" class="mt-4 inline-block text-xs">User tags</label>
			<div v-if="isEditingTags" class="mt-1">
				<div>
					<Message v-if="probe.tags[0]?.format === 'v1'" severity="warn" class="mb-1 mt-2">
						<p class="font-bold">Your tags have an outdated format</p>
						<p class="mt-1">Format like <Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${probe.tags[0].prefix}-${probe.tags[0].value}`"/> is outdated on will be replaced by <Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${probe.tags[0].prefix}:${probe.tags[0].value}`"/> on any change of the tags for that probe. Please make sure to update your tools if they depend on that.</p>
					</Message>
					<div class="flex text-xs">
						<div class="flex-1 content-center">Prefix</div>
						<div class="mx-3"/>
						<div class="flex-1 content-center">Your tag</div>
						<Button icon="pi pi-trash" text class="invisible"/>
					</div>
					<div v-for="(tag, index) in tagsToEdit" :key="index" class="mb-2 flex items-center" :class="{ 'mb-5': !isTagValid(tag.value) }">
						<Select v-model="tag.uPrefix" class="flex-1" :options="uPrefixes" :scroll-height="'200px'"/>
						<div class="mx-2">{{ probe.tags[0]?.format === 'v1' ? '-' : ':' }}</div>
						<div class="relative flex-1">
							<InputText v-model="tag.value" :invalid="!isTagValid(tag.value)" class="w-full" placeholder="my-tag"/>
							<p v-if="!isTagValid(tag.value)" class="absolute pl-1 text-red-500">Invalid tag</p>
						</div>
						<Button icon="pi pi-trash" text aria-label="Remove" class="text-surface-900 dark:text-surface-0" @click="removeTag(index)"/>
					</div>
				</div>
				<div class="mt-1 flex">
					<Button
						label="Add tag"
						icon="pi pi-plus"
						severity="secondary"
						class="dark:!bg-dark-800"
						outlined
						@click="addTag"
					/>
				</div>
			</div>
			<div v-else-if="!isEditingTags && probe.tags.length === 0">
				<Button
					label="Add tag"
					icon="pi pi-plus"
					severity="secondary"
					class="mt-1 dark:!bg-dark-800"
					outlined
					@click="addTag"
				/>
			</div>
			<div v-else class="relative mt-1">
				<ReadOnlyAutoComplete
					id="userTags"
					v-model="userTags"
				/>
				<Button
					label="Edit"
					icon="pi pi-pencil"
					icon-pos="right"
					class="!absolute right-1.5 top-1.5 bg-transparent hover:bg-transparent"
					severity="contrast"
					text
					aria-label="Edit"
					size="small"
					@click="editTags"
				/>
			</div>
			<p class="mt-2 text-xs text-bluegray-400">
				Public user-defined tags that can be used to target the probe in measurements.
				Each tag must be prefixed by your GitHub username or organization.
				E.g., for a user with username <code class="font-bold">jimaek</code>
				and tag <code class="font-bold">home-1</code> the final tag would be <code class="whitespace-nowrap font-bold">u-jimaek:home-1</code>.
			</p>

			<div class="mt-7 flex justify-end">
				<Button
					class="mr-auto"
					label="Delete probe"
					severity="danger"
					icon="pi pi-trash"
					text
					:loading="deleteProbeLoading"
					@click="deleteDialog = true"
				/>
				<Button class="mr-2" label="Close" severity="secondary" text @click="probeDetailsDialog = false"/>
				<Button label="Save" :loading="updateProbeLoading" :disabled="!isSaveEnabled" @click="updateProbe"/>
			</div>
		</div>
		<GPDialog
			v-model:visible="deleteDialog"
			header="Delete probe"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-primary"/>
				</div>
				<div class="ml-3">
					<p>You are about to delete probe <span class="font-bold">{{ probe.name || probe.city }}</span> ({{ probe.ip }}).</p>
					<p>Are you sure you want to delete this probe? You will not be able to undo this action.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete probe" severity="danger" @click="deleteProbe"/>
			</div>
		</GPDialog>
	</GPDialog>
</template>

<script setup lang="ts">
	/* eslint-disable no-extra-parens */
	import { deleteItem, updateItem } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import isEqual from 'lodash/isEqual';
	import memoize from 'lodash/memoize';
	import CountryFlag from 'vue-country-flag-next';
	import { useAuth } from '~/store/auth';
	import { initGoogleMap } from '~/utils/init-google-map';
	import { getProbeStatus } from '~/utils/probe-status';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();

	const props = defineProps({
		probe: {
			type: Object as PropType<Probe>,
			required: true,
		},
		credits: {
			type: Number,
			default: 0,
		},
		gmapsLoaded: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits([ 'save', 'hide', 'delete' ]);

	const auth = useAuth();
	const user = auth.getUser as User;

	// ROOT

	const probeDetailsDialog = ref(true);

	const probe = ref({ ...props.probe });
	watch(() => props.probe, () => {
		probe.value = { ...props.probe };
	});

	useHead(() => {
		return {
			title: `Probe '${props.probe.name || props.probe.city}' -`,
		};
	});

	// GOOGLE MAP

	let removeWatcher: (() => void) | undefined;
	watch(() => props.gmapsLoaded, async () => {
		removeWatcher = await initGoogleMap(probe.value);
	});

	onMounted(async () => {
		if (props.gmapsLoaded) {
			removeWatcher = await initGoogleMap(probe.value);
		}
	});

	onUnmounted(() => {
		removeWatcher && removeWatcher();
	});

	// TAGS

	const isEditingTags = ref<boolean>(false);
	const userTags = computed(() => probe.value.tags.map(({ prefix, value, format }) => format === 'v1' ? `u-${prefix}-${value}` : `u-${prefix}:${value}`));
	const tagsToEdit = ref<{ uPrefix: string, value: string }[]>([]);

	const uPrefixes = [ user.github_username, ...user.github_organizations ].map(value => `u-${value}`);

	const editTags = () => {
		isEditingTags.value = true;

		tagsToEdit.value = probe.value.tags.map(({ prefix, value }) => ({
			uPrefix: `u-${prefix}`,
			value,
		}));
	};

	const addTag = () => {
		isEditingTags.value = true;
		tagsToEdit.value.push({ uPrefix: `u-${user.github_username}`, value: '' });
	};

	const removeTag = (index: number) => {
		tagsToEdit.value?.splice(index, 1);
	};

	const convertTags = (tagsToEdit: { uPrefix: string, value: string }[]) => tagsToEdit.map(({ uPrefix, value }) => ({
		prefix: uPrefix.replace('u-', ''),
		value,
	}));

	const tagRegex = /^[a-zA-Z0-9-]+$/;
	const isTagValid = memoize((value: string) => {
		return value === '' || (value.length <= 32 && tagRegex.test(value));
	});

	const areTagsEmpty = (tags: Probe['tags']) => tags.some(({ prefix, value }) => !prefix || !value);

	// ACTIONS

	const isSaveEnabled = computed(() => (
		probe.value.name !== props.probe.name
		|| probe.value.city !== props.probe.city
		|| !isEqual(probe.value.tags, props.probe.tags)
		|| isEditingTags.value
	));


	const updateProbeLoading = ref(false);
	const updateProbe = async () => {
		updateProbeLoading.value = true;
		const tags = isEditingTags.value ? convertTags(tagsToEdit.value) : probe.value.tags;

		if (areTagsEmpty(tags)) {
			updateProbeLoading.value = false;
			sendToast('error', 'Tags are invalid', 'Some tag values are empty');
			return;
		}

		try {
			await $directus.request(updateItem('gp_adopted_probes', probe.value.id, {
				...(probe.value.name !== props.probe.name && { name: probe.value.name }),
				...(probe.value.city !== props.probe.city && { city: probe.value.city }),
				...(!isEqual(tags, props.probe.tags) && { tags }),
			}));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');
			probeDetailsDialog.value = false;
		} catch (e) {
			sendErrorToast(e);
		}

		updateProbeLoading.value = false;
	};

	const deleteDialog = ref(false);
	const deleteProbeLoading = ref(false);
	const deleteProbe = async () => {
		deleteProbeLoading.value = true;

		try {
			await $directus.request(deleteItem('gp_adopted_probes', probe.value.id));

			sendToast('success', 'Done', 'The probe has been deleted');
			emit('delete');
			probeDetailsDialog.value = false;
		} catch (e) {
			sendErrorToast(e);
		}

		deleteProbeLoading.value = false;
	};
</script>
