<template>
	<Dialog
		v-model:visible="visible"
		position="top"
		:class="{
			'w-auto max-w-[min(800px,95vw)]': props.size === 'auto',
			'min-w-[700px] max-md:min-w-[95%]': props.size === 'large',
			[ props.size ]: ![ 'auto', 'large' ].includes(props.size),
		}"
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
		size: {
			type: String as PropType<'auto' | 'large' | string>,
			default: 'auto',
		},

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

	if (props.viewName) {
		watch(() => route.query.view, async () => {
			visible.value = route.query.view === props.viewName;
		}, { immediate: true });
	}

</script>
