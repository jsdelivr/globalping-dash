<template>
	<!--	TODO: Refactor the component-->
	<div
		ref="containerRef"
		class="w-full"
		@focusin="isFocused = true"
		@focusout="handleFocusOut">
		<AutoComplete
			ref="autocompleteRef"
			v-model="model.name"
			:suggestions="suggestions"
			:pt="{root: { tabindex: '-1' }}"
			option-label="name"
			loader=" "
			class="relative w-full rounded-none"
			input-class="w-full md:rounded-none md:rounded-r-md rounded-md border-none focus:cursor-text cursor-pointer dark:!bg-dark-800"
			overlay-class="w-full"
			aria-label="City name"
			:delay="200"
			complete-on-focus
			append-to="self"
			@item-select="(e) => model = e.value"
			@complete="updateQuery"
			@keydown.enter.stop="(event: KeyboardEvent) => {(!autocompleteRef?.overlayVisible || autocompleteRef?.focusedOptionIndex === -1) && emit('confirm', event)}"
			@keyup.esc="emit('cancel')"
		>
			<template #option="slotProps">
				<span class="flex items-center">
					<span>
						{{slotProps.option.name}}
					</span>
					<span v-if="slotProps.option.country === 'US'">
						, <span class="text-xs text-bluegray-300">{{slotProps.option.state}}</span>
					</span>
				</span>
			</template>
		</AutoComplete>

		<i v-if="!active" class="pi pi-pencil text-md pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" aria-hidden="true"/>

		<Button
			v-if="dirty && model.name.length && isFocused || loading"
			v-tooltip.top="'Save'"
			variant="text"
			severity="secondary"
			icon="pi pi-check"
			class="!absolute !right-2 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-primary focus:!ring-primary"
			:loading="loading"
			:disabled="loading"
			aria-label="Save"
			tabindex="-1"
			@click="(event: MouseEvent) => emit('confirm', event)"
		/>

		<Button
			v-if="dirty && isFocused || loading"
			v-tooltip.top="'Cancel'"
			variant="text"
			severity="secondary"
			icon="pi pi-times"
			class="!absolute !right-2 !top-1/2 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[#ef4444] focus:!ring-[#ef4444]"
			:disabled="loading"
			aria-label="Cancel"
			@keyup.enter="emit('cancel')"
			@click.stop="emit('cancel')"
		/>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import type { VNodeRef } from 'vue';
	const { $directus } = useNuxtApp();

	const model = defineModel<City>({ required: true });
	const inputRef = defineModel<HTMLInputElement | null>('inputRef');

	defineProps({
		active: {
			type: Boolean,
			default: true,
		},
		dirty: {
			type: Boolean,
			default: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits<{
		(e: 'cancel'): void;
		(e: 'confirm', ev: KeyboardEvent | MouseEvent): void;
	}>();

	const containerRef = ref<VNodeRef | null>(null);
	const autocompleteRef = ref<VNodeRef | null>(null);
	const cityQuery = ref<string>(model.value.name);
	const suggestions = ref<City[]>([]);
	const isFocused = ref(false);

	const { data, status, refresh } = await useAsyncData(
		'city-autocomplete',
		() => $directus.request<City[]>(customEndpoint({ path: '/city-autocomplete', params: { query: cityQuery.value, countries: model.value.country } })),
		{
			watch: [ () => model.value.country, cityQuery ],
		},
	);

	watch(
		[ data, status, () => model.value.name ],
		([ newData, newStatus, newInputValue ]) => {
			if (newStatus === 'pending' || !newInputValue.length) {
				return;
			}

			if (Array.isArray(newData)) {
				suggestions.value = newData;
			} else {
				suggestions.value = [];
			}
		},
	);

	onMounted(() => {
		if (autocompleteRef.value) {
			inputRef.value = autocompleteRef.value.$el.querySelector('input');
		}
	});

	const updateQuery = async () => {
		if (model.value.name.trim().length) {
			cityQuery.value = model.value.name.trim();
			await refresh();
		}
	};

	const handleFocusOut = (event: FocusEvent) => {
		const relatedTarget = event.relatedTarget;

		if (containerRef.value?.contains(relatedTarget)) {
			event.stopPropagation();
		}
	};
</script>
