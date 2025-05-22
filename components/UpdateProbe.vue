<template>
	<p>To update your probe, all you have to do is recreate and restart the container.</p>
	<StartProbeCommands class="my-4" :adopt="true" :recreate="true"/>
	<p>Once this is done, your probe is updated and ready to handle measurements.</p>
</template>
