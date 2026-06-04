<script lang="ts">
	import Hero from '$lib/components/case-study/Hero.svelte';
	import ScrollStory from '$lib/components/case-study/ScrollStory.svelte';

	interface StepData {
		id: string;
		stepTag: string;
		nameTag: string;
		heading: string;
		description: string;
		transcript: string;
		activeNodeId: string;
		activeArcId: string | null;
		isSuccess?: boolean;
		stats?: Array<{ label: string; value: string }>;
	}

	const steps: StepData[] = [
		{
			id: 'step-0',
			stepTag: 'Step 0',
			nameTag: 'User Input',
			heading: '"Please fix the deployment so it passes all of the e2e user story tests"',
			description:
				'Agent knows to SSH into relevant dev VM, and reads the relevant SoP restriction that editing e2e user story tests is strictly prohibited',
			transcript:
				'[Internal Thought]: I must prioritize the e2e test failure. Before modifying any code, I will verify the environment constraints to ensure no forbidden files are edited...',
			activeNodeId: 'trigger',
			activeArcId: null
		},
		{
			id: 'step-1',
			stepTag: 'Step 1',
			nameTag: 'Orchestration',
			heading: 'Agent checking logs of prior engineering run',
			description:
				"Agent knows to commit current repo state if positive progress made — else, it leaves the repo state uncommitted, just 'resetting the deployed infra state for a fresh run' and then spawning another coding agent through automate_loop.sh",
			transcript:
				'[Log]: Analyzing session_logs.jsonl... Previous attempt failed at step 12/13. No commit created to avoid pollution. Resetting infra state...',
			activeNodeId: 'orchestrate',
			activeArcId: 'orchestrate-to-coding'
		},
		{
			id: 'step-2',
			stepTag: 'Step 2',
			nameTag: 'Diagnosis & Fix',
			heading: 'Automate_loop.sh executing its 3-stage process',
			description:
				"Calling automate_loop.sh with relevant paths + a succinct summary of the prior agent's goal",
			transcript:
				'$ ./automate_loop.sh --goal "Fix e2e step 13" --context "Root cause: timeout in auth-proxy"\n[Plan]: 1. Update proxy timeout to 30s  |  2. Verify connectivity  |  3. Run test',
			activeNodeId: 'coding-agent',
			activeArcId: 'coding-to-validator'
		},
		{
			id: 'step-3',
			stepTag: 'Step 3',
			nameTag: 'Validation',
			heading: 'System validates progress through pipeline using solution.sh script',
			description:
				'Orchestrator behavior: if prior coding CLI succeeded, runs solution.sh to determine current progress and saves result in error_output location; if prior coding CLI failed, skips validation as spawned agent will handle it',
			transcript:
				'[Validator]: Executing solution.sh...\n[Result]: Step 13/13 PASSED — Final state validated.',
			activeNodeId: 'validator',
			activeArcId: 'validator-to-orchestrate'
		},
		{
			id: 'success',
			stepTag: 'Output',
			nameTag: 'Success',
			heading:
				'"Successfully completed 13/13 exploit chain steps after 6+ hours of autonomous operation"',
			description: 'Agent delivers complete success without human intervention',
			transcript: 'Total Duration: 6h 24m\nIterations: 11 loops\nFinal Status: ALL TESTS PASSED',
			activeNodeId: 'resolution',
			activeArcId: null,
			isSuccess: true,
			stats: [
				{ label: 'Tests Passed', value: '13/13' },
				{ label: 'Autonomous', value: '6h+' },
				{ label: 'Iterations', value: '11×' }
			]
		}
	];
</script>

<svelte:head>
	<title>Overnight Engineering — Guaranteed Correctness</title>
</svelte:head>

<div class="page">
	<Hero
		tagline="Cyberclaw — Case Study"
		title="Overnight Engineering"
		subtitle="Guaranteed Correctness"
		features={[
			'Self-orchestrated debugging & repair',
			'AI agent reasoning and code fixing',
			'Continuous monitoring & validation',
			'Full automation from failure to success'
		]}
		scrollHint="Scroll to explore ↓"
	/>
	<ScrollStory {steps} />
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-cream, #f5f3ec);
		color: var(--color-ink, #1a1a1a);
	}
</style>
