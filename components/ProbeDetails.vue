<template>
	<div class="relative border-t">
		<div id="gp-map" class="h-44"/>
		<div class="absolute inset-x-0 top-2 ml-4 mr-20 flex justify-between">
			<div>
				Status:<span class="ml-2 font-bold">{{ capitalize(probe.status.replaceAll('-', ' ')) }}</span>
				<StatusIcon class="ml-2 text-3xs" :status="probe.status"/>
			</div>
			<div class="flex items-center">
				Credits per month:
				<nuxt-icon class="ml-2 text-green-500" name="coin"/>
				<span class="ml-2 font-bold text-green-500">+{{ props.credits }}</span>
			</div>
			<div>Type:<span class="ml-2 font-bold">{{ props.probe.hardwareDevice || 'Container' }}</span></div>
			<div>Version:<span class="ml-2 font-bold">{{ props.probe.version }}</span></div>
		</div>
	</div>
	<div class="px-5 py-7 dark:text-surface-0">
		<label for="probeName" class="text-xs">Probe name</label>
		<InputText
			id="probeName"
			v-model="probe.name"
			class="mt-1 w-full"
		/>
		<label for="primary-ip" class="mt-3 block text-xs">Primary IP</label>
		<div class="relative mt-1">
			<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
			<InputText
				id="primary-ip"
				v-model="probe.ip"
				disabled
				class="w-full bg-transparent dark:bg-transparent"
			/>
		</div>
		<label for="alternative-ips" class="mt-3 block text-xs">Alternative IPs</label>
		<div class="relative mt-1">
			<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
			<AutoComplete
				id="alternative-ips"
				v-model="probe.altIps"
				class="bg-transparent dark:bg-transparent"
				chip-icon="hidden"
				multiple
				disabled
				:typeahead="false"
			/>
		</div>
		<label for="country" class="mt-3 block text-xs">Country</label>
		<div class="relative mt-1">
			<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
			<InputText
				id="country"
				v-model="probe.country"
				disabled
				class="w-full bg-transparent dark:bg-transparent"
			/>
		</div>
		<label for="city" class="mt-3 block text-xs">City</label>
		<div class="relative mt-1">
			<InputText
				id="city"
				v-model="probe.city"
				class="w-full bg-transparent dark:bg-transparent"
			/>
		</div>
		<p class="mt-1 text-xs text-bluegray-400">
			City where the probe is located. If you know that city is wrong it can be changed here: type in the valid city and click save.
		</p>
		<label for="tags" class="mt-3 block text-xs">Tags</label>
		<div v-if="isEditingTags">
			<div>
				<div v-for="(tag, index) in tagsToEdit" :key="index" class="mb-2 flex items-center" :class="{ 'mb-5': !isTagValid(tag.value) }">
					<Select v-model="tag.uPrefix" class="flex-1" :options="uPrefixes" :scroll-height="'200px'"/>
					<span class="mx-2">-</span>
					<span class="relative flex-1">
						<InputText v-model="tag.value" :invalid="!isTagValid(tag.value)" class="w-full"/>
						<p v-if="!isTagValid(tag.value)" class="absolute pl-1 text-red-500">Invalid tag</p>
					</span>
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
				<Button
					label="Save"
					icon="pi pi-check"
					severity="secondary"
					outlined
					class="ml-auto bg-surface-200"
					@click="saveTags"
				/>
				<Button label="Cancel" severity="secondary" outlined class="ml-1 dark:!bg-dark-800" @click="cancelTags"/>
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
			<AutoComplete
				id="tags"
				v-model="tagStrings"
				class="bg-transparent dark:bg-transparent"
				chip-icon="hidden"
				multiple
				disabled
				:typeahead="false"
			/>
			<Button
				label="Edit tags"
				icon="pi pi-pencil"
				icon-pos="right"
				class="!absolute right-0.5 top-1 text-bluegray-500"
				severity="secondary"
				text
				aria-label="Edit tags"
				size="small"
				@click="editTags"
			/>
		</div>
		<p class="mt-3 text-xs text-bluegray-400">
			Public tags of the probe. They can be used as location filters for a measurement. Format is <code class="font-bold">u-${prefix}-${value}</code> where prefix is user/organization github login, and value is your custom string.

			E.g. for user with github username <code class="font-bold">"jimaek"</code>
			and tag <code class="font-bold">"home1"</code> location filter is<br>
			<code class="font-bold">{ "tags": ["u-jimaek-home1"] }</code>.
		</p>
		<div class="mt-7 flex justify-end">
			<Button
				class="mr-auto"
				label="Delete probe"
				severity="secondary"
				icon="pi pi-trash"
				text
				:loading="deleteProbeLoading"
				@click="deleteDialog = true"
			/>
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="$emit('cancel')"/>
			<Button label="Save" :loading="updateProbeLoading" @click="updateProbe"/>
		</div>
	</div>
	<Dialog
		v-model:visible="deleteDialog"
		position="top"
		class="min-w-[700px] max-md:min-w-[95%]"
		modal
		dismissable-mask
		:draggable="false"
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
	</Dialog>
</template>

<script setup lang="ts">
	import { deleteItem, updateItem } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import memoize from 'lodash/memoize';
	import { useAuth } from '~/store/auth';
	import { initGoogleMap } from '~/utils/init-google-map';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const props = defineProps({
		probe: {
			type: Object as () => Probe,
			default: () => {},
		},
		credits: {
			type: Number,
			default: 0,
		},
	});

	const probe = ref({ ...props.probe });

	initGoogleMap(probe.value);

	const emit = defineEmits([ 'cancel', 'save' ]);

	const { $directus } = useNuxtApp();

	// TAGS

	const auth = useAuth();
	const user = auth.getUser as User;

	const isEditingTags = ref<boolean>(false);
	const tagStrings = computed(() => probe.value.tags.map(({ prefix, value }) => `u-${prefix}-${value}`));
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
		tagsToEdit.value.push({ uPrefix: '', value: '' });
	};

	const removeTag = (index: number) => {
		tagsToEdit.value?.splice(index, 1);
	};

	const saveTags = async () => {
		probe.value.tags = convertTags(tagsToEdit.value);

		tagsToEdit.value = [];

		isEditingTags.value = false;
	};

	const convertTags = (tagsToEdit: { uPrefix: string, value: string }[]) => tagsToEdit.map(({ uPrefix, value }) => ({
		prefix: uPrefix.replace('u-', ''),
		value,
	}));

	const tagRegex = /^[a-zA-Z0-9-]+$/;
	const isTagValid = memoize((value: string) => {
		return value === '' || (value.length <= 32 && tagRegex.test(value));
	});

	const cancelTags = () => {
		tagsToEdit.value = [];
		isEditingTags.value = false;
	};

	// // ACTIONS

	const updateProbeLoading = ref(false);
	const updateProbe = async () => {
		updateProbeLoading.value = true;

		try {
			await $directus.request(updateItem('gp_adopted_probes', probe.value.id, {
				name: probe.value.name,
				city: probe.value.city,
				tags: tagsToEdit.value.length ? convertTags(tagsToEdit.value) : probe.value.tags,
			}));

			sendToast('success', 'Done', 'Probe info was successfully updated');
			emit('save');
		} catch (e) {
			updateProbeLoading.value = false;
			sendErrorToast(e);
		}
	};

	const deleteDialog = ref(false);
	const deleteProbeLoading = ref(false);
	const deleteProbe = async () => {
		deleteProbeLoading.value = true;

		try {
			await $directus.request(deleteItem('gp_adopted_probes', probe.value.id));

			sendToast('success', 'Done', 'Probe was deleted');
			emit('save');
		} catch (e) {
			deleteProbeLoading.value = false;
			sendErrorToast(e);
		}
	};
</script>
