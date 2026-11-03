<template>
	<SettingsOrganization v-if="account.canManageOrg"/>
	<SettingsPersonal v-else/>
</template>

<script setup lang="ts">
	import { useAccount } from '~/store/account';

	const account = useAccount();
</script>
