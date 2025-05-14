<template>
	<div class="flex flex-col rounded-xl border border-surface-300 bg-white dark:border-dark-600 dark:bg-dark-800">
		<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-bluegray-0">
			User tags
		</h3>

		<div class="flex flex-col gap-3 p-6">
			<p class="text-sm leading-[125%] text-bluegray-600 dark:text-bluegray-0">
				Public user-defined tags that can be used to target the probe in measurements.
				Each tag must be prefixed by your GitHub username or organization.
				E.g., for a user with username <code class="font-bold">jimaek</code> and tag <code class="font-bold">home-1</code>
				the final tag would be <code class="font-bold">u-jimaek:home-1</code>.
			</p>

			<div class="flex w-full gap-1">
				<div v-if="probe" class="flex w-full flex-wrap gap-1">
					<span
						v-for="(tag, index) in probe.tags"
						:key="index"
						class="inline-flex h-6 max-w-full items-center overflow-hidden truncate rounded-md border border-surface-300 px-2 text-xs text-bluegray-900 dark:border-dark-600 dark:text-bluegray-0"
						:title="`u-${tag.prefix}${probe.tags[0].format === 'v1' ? '-' : ':'}${tag.value}`"
					>
						<span class="block truncate">
							{{ `u-${tag.prefix}${probe.tags[0].format === 'v1' ? '-' : ':'}${tag.value}` }}
						</span>
					</span>

					<Button
						class="h-6 !border-surface-200 bg-surface-200 !px-3 !py-0 hover:bg-transparent dark:!border-dark-600 dark:bg-dark-600"
						:aria-label="probe.tags.length ? 'Open edit tags dialog' : 'Open add tags dialog'"
						aria-haspopup="dialog"
						:aria-expanded="tagPopoverRef?.value?.visible || false"
						aria-controls="editTagsPopover"
						@click="openEditTagsPopover($event)"
					>
						<i
							class="pi text-sm text-dark-800 dark:text-bluegray-0"
							:class="{
								'pi-pencil': probe.tags.length,
								'pi-plus': !probe.tags.length,
							}"
						/>
						<span class="text-xs text-dark-800 dark:text-bluegray-0">{{ probe.tags.length ? 'Edit' : 'Add' }}</span>
					</Button>
				</div>

				<Popover
					id="editTagsPopover"
					ref="tagPopoverRef"
					class="w-[95%] sm:w-[500px]"
					:class="{
						'!left-1/2 !-translate-x-1/2 !transform': windowSize.width.value < 768
					}"
					role="dialog"
					:aria-label="probe.tags.length ? 'Edit tags dialog' : 'Add tags dialog'"
				>
					<div class="flex flex-col">
						<Message v-if="probe.tags[0]?.format === 'v1'" severity="warn" class="mb-1">
							<p class="font-bold">The tags format has changed</p>

							<div class="mt-1">
								Your tags use an outdated format and will be converted to the new format after saving.
								Please be sure to use the updated tags in all future requests.
								<br>
								<br>

								Outdated format:<br>
								<span v-for="(tag, index) in probe.tags" :key="index">
									<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${tag.prefix}-${tag.value}`"/>
								</span>
								<br>
								<br>

								New format:<br>
								<span v-for="(tag, index) in probe.tags" :key="index">
									<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${tag.prefix}:${tag.value}`"/>
								</span>
							</div>
						</Message>

						<div
							v-if="probe"
							ref="popoverContentRef"
							tabindex="0"
							class="grid w-full flex-1 grid-rows-[auto_1fr] p-4 focus-visible:outline-none focus-visible:ring-0"
						>
							<div v-if="tagsToEdit.length" class="mb-6 grid flex-1 grid-cols-[minmax(6rem,1fr)_auto_minmax(6rem,1fr)_auto] items-center gap-y-5">
								<div class="-mb-2 content-center text-xs font-bold text-dark-800 dark:text-bluegray-0">Prefix</div>
								<div class="mx-3 -mb-2"/>
								<div class="-mb-2 content-center text-xs font-bold text-dark-800 dark:text-bluegray-0">Your tag</div>
								<div class="-mb-2 "/>

								<template v-for="(tag, index) in tagsToEdit" :key="index">
									<Select
										v-model="tag.uPrefix"
										:options="uPrefixes"
										:scroll-height="'200px'"
										aria-label="Tag prefix"
										aria-required="true"
									/>
									<div class="inline-flex w-6 justify-center">{{ probe.tags[0].format === 'v1' ? '-' : ':' }}</div>
									<div class="relative">
										<InputText
											v-model="tag.value"
											:invalid="!isTagValid(tag.value)"
											class="w-full"
											placeholder="my-tag"
											aria-label="Your tag"
										/>
										<p v-if="!isTagValid(tag.value)" class="absolute pl-1 text-red-500">Invalid tag</p>
									</div>

									<div class="ml-2 flex gap-1">
										<Button
											icon="pi pi-trash"
											text
											aria-label="Remove tag"
											class="text-surface-900 dark:text-surface-0"
											@click="removeTag(index)"
										/>
									</div>
								</template>

								<div class="col-span-4 -mt-3">
									<Button
										icon="pi pi-plus"
										text
										label="Add"
										aria-label="Add tag"
										class="text-surface-900 dark:text-surface-0"
										@click="addTag()"
									/>
								</div>
							</div>

							<div v-else class="mb-6 h-[110px]">
								<div>The probe has no user tags</div>

								<div class="col-span-4 mt-2">
									<Button
										icon="pi pi-plus"
										text
										label="Add"
										aria-label="Add tag"
										class="text-surface-900 dark:text-surface-0"
										@click="addTag()"
									/>
								</div>
							</div>

							<div class="flex justify-between">
								<Button
									label="Cancel"
									severity="secondary"
									class="dark:!bg-dark-800"
									outlined
									aria-label="Cancel tag editing"
									@click="closeEditTagsPopover"
								/>
								<Button
									label="Save"
									:loading="probeDetailsUpdating"
									:disabled="probeDetailsUpdating"
									aria-label="Save edited tags"
									@click="updateProbeTags"
								/>
							</div>
						</div>
					</div>
				</Popover>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { updateItem } from '@directus/sdk';
	import isEqual from 'lodash/isEqual';
	import memoize from 'lodash/memoize';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const probe = defineModel('probe', {
		type: Object as PropType<Probe>,
		required: true,
	});

	const probeDetailsUpdating = defineModel('probeDetailsUpdating', {
		type: Boolean,
		required: true,
	});
	const windowSize = useWindowSize();
	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const { $directus } = useNuxtApp();
	const emit = defineEmits([ 'save' ]);

	const uPrefixes = [ user.value.github_username, ...user.value.github_organizations ]
		// Make default prefix the first option
		.sort((prefixA, prefixB) => prefixA === user.value.default_prefix ? -1 : prefixB === user.value.default_prefix ? 1 : 0)
		.map(value => `u-${value}`);
	const tagPopoverRef = ref();
	const tagsToEdit = ref<{ uPrefix: string, value: string, format?: string }[]>([]);
	const isEditingTags = ref<boolean>(false);
	const popoverContentRef = ref<HTMLElement>();

	const openEditTagsPopover = (event: Event) => {
		editTags();

		tagPopoverRef.value?.toggle(event);

		nextTick(() => {
			popoverContentRef.value?.focus();
		});
	};

	const closeEditTagsPopover = () => {
		tagPopoverRef.value?.hide();
	};

	const tagRegex = /^[a-zA-Z0-9-]+$/;
	const isTagValid = memoize((value: string) => {
		return value === '' || (value.length <= 32 && tagRegex.test(value));
	});

	const editTags = () => {
		isEditingTags.value = true;

		tagsToEdit.value = probe.value && probe.value.tags.length ? probe.value.tags.map(({ prefix, value, format }) => ({
			uPrefix: `u-${prefix}`,
			value,
			format,
		})) : [{ uPrefix: uPrefixes[0], value: '' }];
	};

	const addTag = () => {
		isEditingTags.value = true;
		tagsToEdit.value.push({ uPrefix: `u-${user.value.default_prefix}`, value: '' });
	};

	const removeTag = (index: number) => {
		tagsToEdit.value?.splice(index, 1);
	};

	const convertTags = (tagsToEdit: { uPrefix: string, value: string }[]) => tagsToEdit.map(({ uPrefix, value }) => ({
		prefix: uPrefix.replace('u-', ''),
		value,
	}));

	const updateProbeTags = async () => {
		probeDetailsUpdating.value = true;

		if (!probe.value || !probe.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		const updTags = isEditingTags.value ? convertTags(tagsToEdit.value) : probe.value?.tags;

		// check if the tags are filled
		if (!updTags || updTags.some(({ prefix, value }) => !prefix || !value)) {
			sendToast('error', 'Tags are invalid', 'Some tag values are empty');
			probeDetailsUpdating.value = false;

			return;
		}

		// check if the tags have proper format
		if (!updTags || updTags.some(({ value }) => !isTagValid(value))) {
			sendToast('error', 'Tags are invalid', 'Some tag values have an invalid format');
			probeDetailsUpdating.value = false;

			return;
		}

		// close the Popover if tags are left the same
		if (isEqual(updTags, probe.value.tags)) {
			probeDetailsUpdating.value = false;
			closeEditTagsPopover();

			return;
		}

		try {
			await $directus.request(updateItem('gp_probes', probe.value.id, { tags: updTags }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');
			probe.value.tags = updTags;
			closeEditTagsPopover();
		} catch (e) {
			sendErrorToast(e);
		} finally {
			probeDetailsUpdating.value = false;
		}
	};
</script>
