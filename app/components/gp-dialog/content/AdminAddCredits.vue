<template>
	<form class="flex flex-col gap-6 border-t p-5 pt-7 text-bluegray-700 dark:text-surface-0" @submit.prevent="reviewOrSubmit">
		<template v-if="!reviewing">
			<section class="flex flex-col gap-2">
				<label for="creditRecipient" class="font-bold">GitHub username or ID<i class="text-primary">*</i></label>
				<p class="text-sm text-bluegray-500">Enter a GitHub username or numeric GitHub user ID.</p>
				<div class="flex gap-2 max-sm:flex-col">
					<InputText
						id="creditRecipient"
						v-model="recipientInput"
						class="min-w-0 grow"
						:invalid="Boolean(errors.recipient)"
						placeholder="jsDelivr or 6191378"
						:disabled="lookupPending"
						@keydown.enter.prevent="lookupRecipient"
					/>
					<Button
						label="Look up"
						icon="pi pi-search"
						severity="secondary"
						outlined
						:loading="lookupPending"
						@click="lookupRecipient"
					/>
				</div>
				<p v-if="errors.recipient" class="text-sm text-red-500">{{ errors.recipient }}</p>

				<div v-if="recipient" class="mt-2 flex items-center gap-3 rounded-lg border bg-surface-50 p-3 dark:bg-dark-700">
					<img :src="recipient.avatarUrl" class="size-12 rounded-full" alt="">
					<div class="min-w-0 grow">
						<a :href="recipient.profileUrl" target="_blank" rel="noopener" class="font-bold text-primary hover:underline">@{{ recipient.login }}</a>
						<p class="text-sm text-bluegray-500">GitHub ID {{ recipient.githubId }}</p>
					</div>
					<Tag v-if="recipient.dashboardAccount" value="Dashboard account linked" severity="success"/>
					<Tag v-else value="Not linked" severity="warn"/>
				</div>
				<Message v-if="recipient && !recipient.dashboardAccount" severity="warn" icon="pi pi-info-circle">
					The addition will be reserved for this GitHub account and applied when it signs in to Globalping.
				</Message>
			</section>

			<section class="flex flex-col gap-2">
				<span class="font-bold">Addition type<i class="text-primary">*</i></span>
				<div class="grid gap-2 sm:grid-cols-2">
					<button
						type="button"
						class="flex items-start rounded-lg border p-3 text-left"
						:class="additionType === 'payment' ? 'border-primary bg-primary-50 dark:bg-dark-700' : 'hover:border-surface-400 dark:hover:border-dark-400'"
						@click="additionType = 'payment'"
					>
						<span class="flex items-start gap-2">
							<RadioButton v-model="additionType" input-id="manualPayment" value="payment"/>
							<span><b class="block">Manual one-time payment</b><small class="text-bluegray-500">Payment recorded outside the automated GitHub flow.</small></span>
						</span>
					</button>
					<button
						type="button"
						class="flex items-start rounded-lg border p-3 text-left"
						:class="additionType === 'other' ? 'border-primary bg-primary-50 dark:bg-dark-700' : 'hover:border-surface-400 dark:hover:border-dark-400'"
						@click="additionType = 'other'"
					>
						<span class="flex items-start gap-2">
							<RadioButton v-model="additionType" input-id="otherCredits" value="other"/>
							<span><b class="block">Other credits</b><small class="text-bluegray-500">Free credits or another manual adjustment.</small></span>
						</span>
					</button>
				</div>
			</section>

			<section class="flex flex-col gap-2">
				<label for="creditAmount" class="font-bold">Credits to add<i class="text-primary">*</i></label>
				<InputNumber
					id="creditAmount"
					v-model="credits"
					class="w-full"
					input-class="w-full"
					:min="1"
					:max-fraction-digits="0"
					:use-grouping="false"
					:invalid="Boolean(errors.credits)"
				/>
				<p class="text-sm text-bluegray-500">This is the exact final number of credits that will be added. No bonus is calculated for this entry.</p>
				<p v-if="errors.credits" class="text-sm text-red-500">{{ errors.credits }}</p>
			</section>

			<section v-if="additionType === 'payment'" class="flex flex-col gap-2">
				<label for="paymentAmount" class="font-bold">Payment amount (USD)<i class="text-primary">*</i></label>
				<InputNumber
					id="paymentAmount"
					v-model="paymentAmount"
					class="w-full"
					input-class="w-full"
					mode="currency"
					currency="USD"
					locale="en-US"
					:min="0"
					:max-fraction-digits="2"
					:invalid="Boolean(errors.paymentAmount)"
				/>
				<p class="text-sm text-bluegray-500">Saved in sponsorship history and included when calculating bonuses for future automated payments. It does not change the credit amount above.</p>
				<p v-if="errors.paymentAmount" class="text-sm text-red-500">{{ errors.paymentAmount }}</p>
			</section>

			<section v-else class="flex flex-col gap-2">
				<label for="creditComment" class="font-bold">Comment<i class="text-primary">*</i></label>
				<InputText id="creditComment" v-model="comment" class="w-full" :invalid="Boolean(errors.comment)"/>
				<p class="text-sm text-bluegray-500">Describe why these credits are being added. Start with an uppercase letter and end with a period. This is visible to users in their credits history.</p>
				<p v-if="errors.comment" class="text-sm text-red-500">{{ errors.comment }}</p>
			</section>
		</template>

		<template v-else>
			<Message severity="warn" icon="pi pi-exclamation-triangle">
				Review this addition carefully. Adding credits cannot be undone from this page.
			</Message>
			<section class="rounded-xl border">
				<h3 class="border-b px-4 py-3 font-bold">Review addition</h3>
				<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 p-4">
					<dt class="text-bluegray-500">Recipient</dt>
					<dd class="font-semibold">@{{ recipient!.login }} <span class="font-normal text-bluegray-500">(GitHub ID {{ recipient!.githubId }})</span></dd>
					<dt class="text-bluegray-500">Dashboard account</dt>
					<dd>{{ recipient!.dashboardAccount || 'Not linked' }}</dd>
					<dt class="text-bluegray-500">Type</dt>
					<dd>{{ additionType === 'payment' ? 'Manual one-time payment' : 'Other credits' }}</dd>
					<dt class="text-bluegray-500">Credits</dt>
					<dd class="text-xl font-bold">{{ formatNumber(credits!) }}</dd>
					<template v-if="additionType === 'payment'">
						<dt class="text-bluegray-500">Payment amount</dt>
						<dd>{{ formatMoney(paymentAmount!) }}</dd>
					</template>
					<template v-else>
						<dt class="text-bluegray-500">Comment</dt>
						<dd>{{ comment.trim() }}</dd>
					</template>
				</dl>
			</section>
		</template>

		<div class="flex justify-end gap-2">
			<Button
				v-if="reviewing"
				type="button"
				label="Back"
				severity="secondary"
				text
				:disabled="submitting"
				@click="reviewing = false"
			/>
			<Button
				v-else
				type="button"
				label="Cancel"
				severity="secondary"
				text
				@click="emit('cancel')"
			/>
			<Button type="submit" :label="reviewing ? 'Add credits' : 'Review addition'" :icon="reviewing ? undefined : 'pi pi-arrow-right'" icon-pos="right" :loading="submitting"/>
		</div>
	</form>
</template>

<script setup lang="ts">
	import { customEndpoint, readUsers } from '@directus/sdk';
	import { formatNumber } from '~/utils/format-number';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	type AdditionType = 'payment' | 'other';
	type GithubUser = { id: number; login: string; avatar_url: string; html_url: string };
	type Recipient = {
		githubId: string;
		login: string;
		avatarUrl: string;
		profileUrl: string;
		dashboardAccount: string | null;
	};

	const emit = defineEmits<{
		(e: 'cancel' | 'success'): void;
	}>();
	const { $directus } = useNuxtApp();
	const recipientInput = ref('');
	const recipient = ref<Recipient | null>(null);
	const lookupPending = ref(false);
	const additionType = ref<AdditionType>('payment');
	const credits = ref<number | null>(null);
	const paymentAmount = ref<number | null>(null);
	const comment = ref('');
	const reviewing = ref(false);
	const submitting = ref(false);
	const errors = reactive({ recipient: '', credits: '', paymentAmount: '', comment: '' });

	watch(recipientInput, () => {
		recipient.value = null;
		errors.recipient = '';
	});

	watch(additionType, () => {
		errors.paymentAmount = '';
		errors.comment = '';
	});

	const lookupRecipient = async () => {
		const input = recipientInput.value.trim();

		if (!input) {
			errors.recipient = 'Enter a GitHub username or ID.';
			return;
		}

		if (input.startsWith('@')) {
			errors.recipient = 'Enter GitHub usernames without @.';
			return;
		}

		lookupPending.value = true;
		errors.recipient = '';
		recipient.value = null;

		try {
			const endpoint = /^\d+$/.test(input)
				? `https://api.github.com/user/${input}`
				: `https://api.github.com/users/${encodeURIComponent(input)}`;
			const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.github+json' } });

			if (response.status === 404) {
				throw new Error('GitHub account not found.');
			}

			if (!response.ok) {
				throw new Error(response.status === 403 || response.status === 429
					? 'GitHub lookup is temporarily unavailable because its request limit was reached.'
					: 'GitHub lookup failed.');
			}

			const githubUser = await response.json() as GithubUser;
			const dashboardUsers = await $directus.request(readUsers({
				filter: { external_identifier: { _eq: String(githubUser.id) } },
				fields: [ 'id', 'github_username' ],
				limit: 1,
			})) as Array<{ id: string; github_username: string | null }>;
			const dashboardUser = dashboardUsers[0];

			recipient.value = {
				githubId: String(githubUser.id),
				login: githubUser.login,
				avatarUrl: githubUser.avatar_url,
				profileUrl: githubUser.html_url,
				dashboardAccount: dashboardUser?.github_username || dashboardUser?.id || null,
			};
		} catch (error) {
			errors.recipient = error instanceof Error ? error.message : 'GitHub lookup failed.';
		} finally {
			lookupPending.value = false;
		}
	};

	const validate = () => {
		errors.recipient = recipient.value ? '' : 'Look up and confirm a GitHub account.';
		errors.credits = Number.isInteger(credits.value) && (credits.value || 0) > 0 ? '' : 'Enter a positive whole number of credits.';
		errors.paymentAmount = '';
		errors.comment = '';

		if (additionType.value === 'payment') {
			errors.paymentAmount = paymentAmount.value !== null && paymentAmount.value > 0 ? '' : 'Enter a positive payment amount.';
		} else {
			const value = comment.value.trim();
			errors.comment = /^[A-Z].*\.$/s.test(value) ? '' : 'Start the comment with an uppercase letter and end it with a period.';
		}

		return !Object.values(errors).some(Boolean);
	};

	const reviewOrSubmit = async () => {
		if (!reviewing.value) {
			if (validate()) { reviewing.value = true; }

			return;
		}

		if (!recipient.value || credits.value === null) { return; }

		submitting.value = true;

		try {
			const addition = additionType.value === 'payment'
				? {
					type: 'payment' as const,
					githubId: recipient.value.githubId,
					credits: credits.value,
					amountInDollars: paymentAmount.value!,
				}
				: {
					type: 'other' as const,
					githubId: recipient.value.githubId,
					credits: credits.value,
					comment: comment.value.trim(),
				};

			await $directus.request(customEndpoint({ method: 'POST', path: '/admin-sponsors/manual-additions', body: JSON.stringify(addition) }));
			sendToast('success', 'Credits added', `${formatNumber(credits.value)} credits were added for @${recipient.value.login}.`);
			emit('success');
		} catch (error) {
			sendErrorToast(error);
		} finally {
			submitting.value = false;
		}
	};

	const formatMoney = (value: number) => `$${formatNumber(value)}`;
</script>
