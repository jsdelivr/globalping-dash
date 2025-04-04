<template>
	<div :class="props.class">
		<div class="mt-4 flex flex-wrap items-center gap-4">
			<SelectButton
				v-model="platform"
				:options="platformOptions"
				:allow-empty="false"
				option-label="name"
				option-value="value"
				aria-labelledby="basic"
				severity="primary"
				class="mr-auto"
				@update:model-value="onChangePlatform"
			/>

			<div v-if="props.adopt === undefined" class="flex items-center">
				<ToggleSwitch v-model="adopt" :input-id="`public-probes-${getCurrentInstance()?.uid}`"/>
				<label :for="`public-probes-${getCurrentInstance()?.uid}`" class="ml-2 cursor-pointer font-bold">Adopt the probe under my account</label>
			</div>
		</div>

		<Message v-if="adopt" severity="warn" class="my-4" icon="pi pi-lightbulb">
			The command below includes your <strong>secret adoption token</strong> to automatically
			adopt the new probe under your account.
		</Message>

		<div class="relative">
			<CopyButton :content="commands[platform][size]"/>
			<div ref="codeWrapperElem" class="mt-4 box-content overflow-hidden rounded-xl border p-4 pr-0 transition-[height] duration-500 dark:bg-dark-900">
				<div ref="codeElem">
					<pre v-if="size === 'compact'" class="no-scrollbar flex min-h-[22px] items-center overflow-scroll"><code class="mr-16">{{ commands[platform][size] }}</code></pre>
					<div v-if="size === 'expanded'" class="no-scrollbar overflow-scroll">
						<pre v-for="line in commands[platform][size]" :key="line.toString()"><code>{{ line[0] }}</code><code class="mr-16 text-bluegray-300">{{ line[1] }}</code></pre>
					</div>
				</div>
			</div>
		</div>
		<div class="flex justify-center">
			<Button
				class="size-6 rounded-t-none border-t-0"
				size="small"
				outlined
				severity="secondary"
				aria-label="Toggle expand"
				@click="toggleSize"
			>
				<i class="pi text-xs" :class="{'pi-chevron-down': size === 'compact', 'pi-chevron-up': size === 'expanded'}"/>
			</Button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';
	import { smoothResize } from '~/utils/smooth-resize';

	const props = defineProps({
		adopt: {
			type: Boolean,
			default: undefined,
		},
		class: {
			type: String,
			default: '',
		},
		recreate: {
			type: Boolean,
			default: false,
		},
	});

	const auth = useAuth();
	const { user } = storeToRefs(auth);

	const codeWrapperElem = ref<HTMLElement>();
	const codeElem = ref<HTMLElement>();
	const adopt = ref(props.adopt ?? true);

	const updateCommands = {
		docker: [
			[ 'docker pull globalping/globalping-probe', ' # Pull the latest image' ],
			[ 'docker stop globalping-probe', ' # Stop the container if it is running' ],
			[ 'docker rm globalping-probe', ' # Remove the old container' ],
		],
		podman: [
			[ 'podman pull globalping/globalping-probe', ' # Pull the latest image' ],
			[ 'podman stop globalping-probe', ' # Stop the container if it is running' ],
			[ 'podman rm globalping-probe', ' # Remove the old container' ],
		],
	};

	const commands = computed(() => {
		return {
			docker: {
				compact: `${props.recreate ? `${updateCommands.docker.map(c => c[0]).join('; ')};\n` : ''}docker run -d ${adopt.value ? `-e GP_ADOPTION_TOKEN=${user.value.adoption_token} ` : ''}--log-driver local --network host --restart=always --name globalping-probe globalping/globalping-probe`,
				expanded: [
					...props.recreate ? updateCommands.docker : [],
					[ 'docker run -d \\', ' # Make sure the container runs on boot' ],
					...adopt.value ? [ [ `-e GP_ADOPTION_TOKEN=${user.value.adoption_token} \\`, ' # Automatically add the probe to your account' ] ] : [],
					[ '--log-driver local \\', ' # Use the modern logging driver to ensure old logs are deleted' ],
					[ '--network host \\', ' # Bypass overlay and mesh networking to ensure they dont impact latency tests' ],
					[ '--restart=always \\', ' # Restart the container in case it crashes' ],
					[ '--name globalping-probe globalping/globalping-probe' ],
				],
			},
			podman: {
				compact: `${props.recreate ? `${updateCommands.podman.map(c => c[0]).join('; ')};\n` : ''}sudo podman run -d ${adopt.value ? `-e GP_ADOPTION_TOKEN=${user.value.adoption_token} ` : ''}--cap-add=NET_RAW --network host --restart=always --name globalping-probe globalping/globalping-probe`,
				expanded: [
					...props.recreate ? updateCommands.podman : [],
					[ 'sudo \\', ' # Allows the --cap-add=NET_RAW option to work properly' ],
					[ 'podman run -d \\', ' # The container will NOT start on boot. You need to create a systemd service first.' ],
					...adopt.value ? [ [ `-e GP_ADOPTION_TOKEN=${user.value.adoption_token} \\`, ' # Automatically add the probe to your account' ] ] : [],
					[ '--cap-add=NET_RAW \\', ' # Network permissions to run ping' ],
					[ '--network host \\', ' # Bypass overlay and mesh networking to ensure they dont impact latency tests' ],
					[ '--restart=always \\', ' # Restart the container in case it crashes' ],
					[ '--name globalping-probe globalping/globalping-probe' ],
				],
			},
		};
	});

	const platformOptions = [
		{ name: 'Docker', value: 'docker' },
		{ name: 'Podman', value: 'podman' },
	];

	const platform: Ref<'docker' | 'podman'> = ref('docker');
	const size: Ref<'compact' | 'expanded'> = ref('compact');

	const onChangePlatform = () => {
		smoothResize(codeWrapperElem.value!, codeElem.value!, codeElem.value!);
	};

	const toggleSize = () => {
		size.value = size.value === 'compact' ? 'expanded' : 'compact';
		smoothResize(codeWrapperElem.value!, codeElem.value!, codeElem.value!);
	};
</script>
