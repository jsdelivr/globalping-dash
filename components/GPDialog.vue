<template>
	<Dialog
		v-model:visible="visible"
		position="top"
		class="min-w-[700px] max-md:min-w-[95%]"
		modal
		dismissable-mask
		:draggable="false"
		@after-hide="afterHide()"
	>
		<slot/>
	</Dialog>
</template>

<script setup lang="ts">
	const route = useRoute();
	const router = useRouter();

	const emit = defineEmits([
		'after-hide',
	]);

	const visible = defineModel('visible', {
		type: Boolean,
		default: false,
	});

	const props = defineProps({
		/** If set, automatically show the dialog when the URL contains ?view=${viewName} parameter */
		viewName: {
			type: String as PropType<string | undefined>,
			default: undefined,
		},
	});

	const afterHide = () => {
		if (props.viewName && route.query.view === props.viewName) {
			const { view, ...newQuery } = route.query;

			router.push({
				path: route.path,
				query: newQuery,
			});
		}

		emit('after-hide');
	};

	onMounted(() => {
		if (props.viewName) {
			watch(() => route.query.view, async () => {
				visible.value = route.query.view === props.viewName;
			}, { immediate: true });
		}
	});

</script>
