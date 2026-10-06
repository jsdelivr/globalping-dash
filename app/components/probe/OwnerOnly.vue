<template>
	<span v-tooltip.top="account.canManageProbes ? null : 'Only organization admins can do this'">
		<slot :disabled="!account.canManageProbes"/>
	</span>
</template>

<script setup lang="ts">
	import { useAccount } from '~/store/account';
	const account = useAccount();
</script>
