<template>
	<p>To join the Globalping probe network all you have to do is run our container.</p>
	<div class="mt-4">
		<SelectButton
			v-model="platform"
			:options="platformOptions"
			:allow-empty="false"
			option-label="name"
			option-value="value"
			aria-labelledby="basic"
			severity="primary"
			@update:model-value="onChangePlatform"
		/>
	</div>
	<div ref="codeWrapperElem" class="relative mt-4 box-content overflow-hidden rounded-xl border p-4 pr-0 transition-[height] duration-500 dark:bg-dark-900">
		<!-- TODO: P1: related ^ all the modals may work better if they are closer to the top, not fully vertically centered -->

		<!-- TODO: P3: collapse/expand thing could be a component -->
		<div ref="codeElem">
			<pre v-if="size === 'compact'" class="no-scrollbar flex min-h-[22px] items-center overflow-scroll"><code class="mr-16">{{ commands[platform][size] }}</code></pre>
			<div v-if="size === 'expanded'" class="no-scrollbar overflow-scroll">
				<pre v-for="line in commands[platform][size]" :key="line.toString()"><code>{{ line[0] }}</code><code class="mr-16 text-bluegray-300">{{ line[1] }}</code></pre>
			</div>
		</div>
		<div class="!absolute right-2 top-2">
			<!-- TODO: P3: copy button could be a component -->
			<Button
				icon="pi pi-copy"
				severity="secondary"
				aria-label="Copy"
				outlined
				@click="copyCommand"
			/>
			<div v-if="copyTooltip" class="absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-bluegray-700 p-2 text-surface-0">
				Copied!
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
	<p class="mt-4">Once you connect, you will become part of the global community that powers the Globalping Platform. The container works on both x86 and ARM architectures.</p>
</template>

<script setup lang="ts">
	import { smoothResize } from '~/utils/smooth-resize';

	const codeWrapperElem = ref<HTMLElement>();
	const codeElem = ref<HTMLElement>();

	const commands = {
		docker: {
			compact: 'docker run -d --log-driver local --network host --restart=always --name globalping-probe globalping/globalping-probe',
			expanded: [
				[ 'docker run -d \\', ' # Make sure the container runs on boot' ],
				[ '--log-driver local \\', ' # Use the modern logging driver to ensure old logs are deleted' ],
				[ '--network host \\', ' # Bypass overlay and mesh networking to ensure they dont impact latency tests' ],
				[ '--restart=always \\', ' # Restart the container in case it crashes' ],
				[ '--name globalping-probe globalping/globalping-probe' ],
			],
		},
		podman: {
			compact: 'sudo podman run -d --cap-add=NET_RAW --network host --restart=always --name globalping-probe globalping/globalping-probe',
			expanded: [
				[ 'sudo \\', ' # Allows the --cap-add=NET_RAW option to work properly' ],
				[ 'podman run -d \\', ' # The container will NOT start on boot. You need to create a systemd service first.' ],
				[ '--cap-add=NET_RAW \\', ' # Network permissions to run ping' ],
				[ '--network host \\', ' # Bypass overlay and mesh networking to ensure they dont impact latency tests' ],
				[ '--restart=always \\', ' # Restart the container in case it crashes' ],
				[ '--name globalping-probe globalping/globalping-probe' ],
			],
		},
	};

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

	const copyTooltip = ref(false);
	const copyCommand = async () => {
		let content = commands[platform.value][size.value];

		if (Array.isArray(content)) {
			content = content.map(parts => parts.join('')).join('\n');
		}

		await navigator.clipboard.writeText(content);
		copyTooltip.value = true;
		setTimeout(() => copyTooltip.value = false, 1000);
	};
</script>
