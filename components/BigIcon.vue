<template>
	<div :class="{'big-icon': border}">
		<nuxt-icon class="big-icon__icon" :class="{big: border}" :name="name" :filled="filled"/>
		<i v-if="online" class="pi pi-circle-fill big-icon__online"/>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		name: {
			type: String,
			default: '',
		},
		filled: Boolean,
		border: Boolean,
		online: Boolean,
	});
</script>

<style scoped>
  .big-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--surface-300);
    position: relative;
  }

  .big-icon__icon {
    color: var(--primary-color);
    font-size: 16px;
  }

  .big-icon__icon.big {
    font-size: 20px;
  }

  .big-icon__online {
    font-size: 0.6rem;
    position: absolute;
    top: 0;
    right: -3px;
    border: 2px solid var(--surface-0);
    border-radius: 50%;
    color: var(--green-500);
  }
</style>
