<template>
	<Dialog
		v-model:visible="visible"
		position="top"
		class="gp-dialog"
		:class="{
			'w-auto max-w-[min(900px,95vw)]': props.size === 'auto',
			'w-[50vw] min-w-[700px] max-w-[min(900px,95vw)] max-md:min-w-[95%]': props.size === 'large',
			[ props.size ]: ![ 'auto', 'large' ].includes(props.size),
		}"
		modal
		dismissable-mask
		:draggable="false"
		@after-hide="afterHide()"
	>
		<slot/>
		<template v-if="$slots.footer" #footer>
			<slot name="footer"/>
		</template>
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

<style>
	@media (max-height: 600px) {
		.gp-dialog {
			max-height: calc(100dvh - 32px);
			margin-block: 16px;
		}
	}
</style>
