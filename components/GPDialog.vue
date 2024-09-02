<template>
	<Dialog
		position="top"
		class="min-w-[700px] max-md:min-w-[95%]"
		modal
		dismissable-mask
		:draggable="false"
	>
		<slot/>
	</Dialog>
</template>
