<script lang="ts">
	let { activeNodeId, activeArcId }: { activeNodeId: string; activeArcId: string | null } =
		$props();

	let isOrchActive = $derived(activeNodeId === 'orchestrate');
	let isCodingActive = $derived(activeNodeId === 'coding-agent');
	let isValidatorActive = $derived(activeNodeId === 'validator');
	let isTriggerActive = $derived(activeNodeId === 'trigger');
	let isResolutionActive = $derived(activeNodeId === 'resolution');

	let isArcOrchToCoding = $derived(activeArcId === 'orchestrate-to-coding');
	let isArcCodingToValidator = $derived(activeArcId === 'coding-to-validator');
	let isArcValidatorToOrch = $derived(activeArcId === 'validator-to-orchestrate');
</script>

<svg
	viewBox="0 0 200 218"
	overflow="visible"
	aria-label="Autonomous engineering cycle diagram"
	class="cycle-diagram"
	xmlns="http://www.w3.org/2000/svg"
>
	<!-- Defs: arrow markers -->
	<defs>
		<marker id="arr-gray" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
			<polygon points="0 0, 7 3.5, 0 7" fill="#CFCBC0" />
		</marker>
		<marker id="arr-gold" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
			<polygon points="0 0, 7 3.5, 0 7" fill="#C9A227" />
		</marker>
	</defs>

	<!-- Background: dashed orbit circle -->
	<circle
		cx="100"
		cy="108"
		r="62"
		fill="none"
		stroke="#CFCBC0"
		stroke-width="0.5"
		stroke-dasharray="3 6"
		opacity="0.35"
	/>

	<!-- Background: center label -->
	<text
		x="100"
		y="112"
		text-anchor="middle"
		font-family="'JetBrains Mono', monospace"
		font-size="8"
		font-weight="700"
		fill="#CFCBC0"
		letter-spacing="0.12em"
		opacity="0.6"
	>
		LOOP
	</text>

	<!-- Arc: Orchestrate -> Coding Agent -->
	<path
		d="M 113,65 Q 176,82 143,121"
		fill="none"
		stroke={isArcOrchToCoding ? '#C9A227' : '#CFCBC0'}
		stroke-width="1.5"
		marker-end={isArcOrchToCoding ? 'url(#arr-gold)' : 'url(#arr-gray)'}
		class="arc"
	/>

	<!-- Arc: Coding Agent -> Validator -->
	<path
		d="M 131,142 Q 100,188 69,142"
		fill="none"
		stroke={isArcCodingToValidator ? '#C9A227' : '#CFCBC0'}
		stroke-width="1.5"
		marker-end={isArcCodingToValidator ? 'url(#arr-gold)' : 'url(#arr-gray)'}
		class="arc"
	/>

	<!-- Arc: Validator -> Orchestrate -->
	<path
		d="M 57,121 Q 24,82 87,65"
		fill="none"
		stroke={isArcValidatorToOrch ? '#C9A227' : '#CFCBC0'}
		stroke-width="1.5"
		marker-end={isArcValidatorToOrch ? 'url(#arr-gold)' : 'url(#arr-gray)'}
		class="arc"
	/>

	<!-- IO: Trigger (above triangle) -->
	<g class="io-trigger">
		<text
			x="100"
			y="8"
			text-anchor="middle"
			font-family="'JetBrains Mono', monospace"
			font-size="7"
			font-weight="700"
			fill={isTriggerActive ? '#C9A227' : '#CFCBC0'}
			letter-spacing="0.1em"
			class="io-label"
		>
			TRIGGER
		</text>
		<line
			x1="100"
			y1="10"
			x2="100"
			y2="21"
			stroke={isTriggerActive ? '#C9A227' : '#CFCBC0'}
			stroke-width="1.5"
			class="io-line"
		/>
		<polygon
			points="96,19 104,19 100,24"
			fill={isTriggerActive ? '#C9A227' : '#CFCBC0'}
			class="io-arrow"
		/>
	</g>

	<!-- IO: Resolution (below triangle) -->
	<g class="io-resolution">
		<line
			x1="100"
			y1="166"
			x2="100"
			y2="177"
			stroke={isResolutionActive ? '#C9A227' : '#CFCBC0'}
			stroke-width="1.5"
			class="io-line"
		/>
		<polygon
			points="96,175 104,175 100,180"
			fill={isResolutionActive ? '#C9A227' : '#CFCBC0'}
			class="io-arrow"
		/>
		<text
			x="100"
			y="192"
			text-anchor="middle"
			font-family="'JetBrains Mono', monospace"
			font-size="7"
			font-weight="700"
			fill={isResolutionActive ? '#C9A227' : '#CFCBC0'}
			letter-spacing="0.1em"
			class="io-label"
		>
			RESOLUTION
		</text>
	</g>

	<!-- Node: Orchestrate (top) -->
	<g
		class="node"
		style="filter: {isOrchActive ? 'drop-shadow(0 0 9px rgba(201,162,39,0.55))' : 'none'}"
	>
		<circle
			cx="100"
			cy="46"
			r="24"
			fill={isOrchActive ? 'rgba(201,162,39,0.1)' : '#F5F3EC'}
			stroke={isOrchActive ? '#C9A227' : '#CFCBC0'}
			stroke-width={isOrchActive ? 2.5 : 1.5}
			class="node-circle"
		/>
		<text
			x="100"
			y="43"
			text-anchor="middle"
			font-family="sans-serif"
			font-size="9.5"
			font-weight="700"
			fill={isOrchActive ? '#1A1A1A' : '#AEAAA0'}
			class="node-label"
		>
			Orches-
		</text>
		<text
			x="100"
			y="53"
			text-anchor="middle"
			font-family="sans-serif"
			font-size="9.5"
			font-weight="700"
			fill={isOrchActive ? '#1A1A1A' : '#AEAAA0'}
			class="node-label"
		>
			trate
		</text>
	</g>

	<!-- Node: Coding Agent (bottom-right) -->
	<g
		class="node"
		style="filter: {isCodingActive ? 'drop-shadow(0 0 9px rgba(201,162,39,0.55))' : 'none'}"
	>
		<circle
			cx="154"
			cy="139"
			r="24"
			fill={isCodingActive ? 'rgba(201,162,39,0.1)' : '#F5F3EC'}
			stroke={isCodingActive ? '#C9A227' : '#CFCBC0'}
			stroke-width={isCodingActive ? 2.5 : 1.5}
			class="node-circle"
		/>
		<text
			x="154"
			y="136"
			text-anchor="middle"
			font-family="sans-serif"
			font-size="9.5"
			font-weight="700"
			fill={isCodingActive ? '#1A1A1A' : '#AEAAA0'}
			class="node-label"
		>
			Coding
		</text>
		<text
			x="154"
			y="146"
			text-anchor="middle"
			font-family="sans-serif"
			font-size="9.5"
			font-weight="700"
			fill={isCodingActive ? '#1A1A1A' : '#AEAAA0'}
			class="node-label"
		>
			Agent
		</text>
	</g>

	<!-- Node: Validator (bottom-left) -->
	<g
		class="node"
		style="filter: {isValidatorActive ? 'drop-shadow(0 0 9px rgba(201,162,39,0.55))' : 'none'}"
	>
		<circle
			cx="46"
			cy="139"
			r="24"
			fill={isValidatorActive ? 'rgba(201,162,39,0.1)' : '#F5F3EC'}
			stroke={isValidatorActive ? '#C9A227' : '#CFCBC0'}
			stroke-width={isValidatorActive ? 2.5 : 1.5}
			class="node-circle"
		/>
		<text
			x="46"
			y="136"
			text-anchor="middle"
			font-family="sans-serif"
			font-size="9.5"
			font-weight="700"
			fill={isValidatorActive ? '#1A1A1A' : '#AEAAA0'}
			class="node-label"
		>
			Vali-
		</text>
		<text
			x="46"
			y="146"
			text-anchor="middle"
			font-family="sans-serif"
			font-size="9.5"
			font-weight="700"
			fill={isValidatorActive ? '#1A1A1A' : '#AEAAA0'}
			class="node-label"
		>
			dator
		</text>
	</g>
</svg>

<style>
	.cycle-diagram {
		width: 100%;
		max-width: 210px;
	}

	.arc {
		transition:
			stroke 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1)),
			stroke-width 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}

	.node-circle {
		transition:
			fill 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1)),
			stroke 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1)),
			stroke-width 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}

	.node-label {
		transition: fill 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}

	.node {
		transition: filter 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}

	.io-label,
	.io-line,
	.io-arrow {
		transition:
			fill 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1)),
			stroke 550ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}
</style>
