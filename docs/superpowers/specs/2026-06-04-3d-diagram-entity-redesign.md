# 3D System Diagram — Entity-Based Redesign

## Problem

The current 3D cycle diagram uses 5 identical spheres connected by arcs. This fails to communicate what the Cyberclaw system actually is: an autonomous agent (CyberClaw) that SSHs into a development VM and spawns sub-processes (automate_loop.sh) to diagnose, plan, and fix failing tests. The spheres are generic — they don't represent real infrastructure entities, and the particle animations don't map to what's actually happening at each step.

## Goal

Replace the abstract sphere-and-arc diagram with an entity-based representation that shows:
- The CyberClaw agent as a visually distinct entity
- The development VM as a separate server/machine
- SSH as the connection between them
- automate_loop.sh and its 3-stage process as a sub-system inside the VM
- The validation and retry loop

The result should look more impressive and technically grounded while remaining tasteful — not over-the-top or sci-fi.

---

## Entities

### CyberClaw (Agent)

**What it represents:** The autonomous agent that orchestrates the entire process. It checks logs of prior runs, decides whether to commit or reset, and spawns CLI agents via SSH.

**Visual appearance:**
- A 3D box with a subtly different shape from the Dev VM — chamfered or beveled top corners to distinguish it as an "agent" rather than plain infrastructure
- A small floating sphere or circular icon near the top of the box — an "eye" or "core" indicator that communicates intelligence/agency
- A faint dashed orbit ring slowly rotating around the box — further distinguishing it from a static server
- Front face shows: "CYBERCLAW" label, an "orchestrator" sub-region, and iteration status indicators (e.g., small dots showing progress like "7/11")
- Gold accent color for borders and active highlights
- Subtle floating animation (gentle bob/sway)

**Sub-regions (highlighted per step):**
1. The whole box (Step 0 — receiving user instruction)
2. The orchestrator sub-region (Step 1 — checking logs, deciding to commit/reset)

### Dev VM (Server)

**What it represents:** The remote development VM that CyberClaw SSHs into. Contains the CLI agent session, automate_loop.sh, and the validation script.

**Visual appearance:**
- A 3D box of similar size to CyberClaw — standard rectangular server shape
- Visually distinct from CyberClaw: no chamfered corners, no orbit ring, no floating animation — it's infrastructure, not an agent. Uses muted border color instead of gold.
- Front face shows at "full view" zoom level:
  - "DEV VM" header label
  - "CLI Agent" sub-region (the SSH session that landed)
  - "automate_loop.sh" as a collapsed/labeled rect (detail not readable at this zoom)
  - "solution.sh" validator sub-region

**Zoom behavior (critical):**
- At all steps except Step 2, the automate_loop detail is collapsed — just a labeled boundary. This prevents visual overload.
- At Step 2, the camera zooms into the Dev VM, and the automate_loop section expands to show its full 3-stage detail (see Step 2 below).
- The transition between collapsed and expanded should be smooth — either a CSS/opacity transition on the HTML overlay content, or a geometry-level scale animation.

**Sub-regions (highlighted per step):**
1. Whole box dims to background (Steps 0-1, focus is on CyberClaw)
2. automate_loop stages (Step 2 — zoomed in, see below)
3. Validator sub-region (Step 3 — solution.sh)
4. Success badge (Step 4)

### SSH Connection

**What it represents:** The SSH tunnel between CyberClaw and the Dev VM.

**Visual appearance:**
- A line/tube connecting the two entity boxes
- Dashed or segmented appearance (communicating "network connection")
- Small particle dots travelling along it from CyberClaw toward the VM (communicating data/command flow)
- An "SSH" label near the midpoint

**Activation:** Particles travel and the line brightens when active (Steps 0-1). Dims when focus shifts to the VM interior.

### Return Path

**What it represents:** Results flowing back from the VM to CyberClaw (for the retry loop).

**Visual appearance:**
- A subtle, lower-opacity connection from the VM back to CyberClaw
- Dashed, muted color
- A "result" label
- Only becomes visible/highlighted during Steps 3-4 (validation result returning)

---

## Scroll Step Behavior

### Step 0: User Input (TRIGGER)

**Camera:** Full system view — both entities visible, centered.

**What the viewer sees:**
- CyberClaw box glows with gold accent — it's receiving the user's instruction
- The "eye"/core icon on CyberClaw pulses subtly (agent is "activating")
- SSH connection particles begin travelling toward the VM (agent is about to dispatch)
- Dev VM is visible but dim/inactive

**What it communicates:** "The user gives an instruction, and the CyberClaw agent receives it."

### Step 1: Orchestration

**Camera:** Full system view.

**What the viewer sees:**
- CyberClaw's "orchestrator" sub-region highlights with a gold border/glow
- Status dots on CyberClaw animate (showing iteration progress)
- Particles pulse along the return path (agent is checking prior run logs)
- SSH connection shows data flowing (agent is communicating with the VM)
- Dev VM is visible but secondary

**What it communicates:** "The agent checks what happened last time — did it make progress? Should it commit and continue, or reset and retry?"

### Step 2: Diagnosis & Fix (CODING AGENT)

**Camera:** Smoothly zooms into the Dev VM, centering on the automate_loop section. CyberClaw slides partially or fully out of view (or fades to a hint at the edge). Transition should take ~700-800ms.

**What the viewer sees (zoomed in):**
- Dev VM fills most of the viewport
- automate_loop.sh boundary is now fully expanded and readable
- Three stages visible inside: **DIAGNOSE → PLAN → IMPLEMENT**
- Each stage has a label and brief description text
- Stages light up sequentially in a continuous loop (left to right) — DIAGNOSE glows gold, then PLAN, then IMPLEMENT, then the cycle repeats. Each stage stays lit for ~1-1.5s before the highlight moves to the next. This loops as long as Step 2 is active.
- Small particles/arrows flow between stages showing data progression
- The "CLI Agent" sub-region above automate_loop shows this is a spawned SSH session
- A faint retry arrow loops from the end back to the beginning (showing the internal retry loop)

**What it communicates:** "Inside the VM, the spawned agent runs a 3-stage process: investigate the error, plan the fix, then implement it."

### Step 3: Validation

**Camera:** Smoothly zooms back out to the full system view (~700-800ms transition).

**What the viewer sees:**
- Camera pulls back, both entities visible again
- Dev VM's "solution.sh / validator" sub-region highlights
- Converging animation toward the validator region (particles spiraling inward — similar to the existing validator animation concept)
- Return path from VM back to CyberClaw begins to glow (result is about to flow back)

**What it communicates:** "The system validates the fix by running solution.sh. Did the tests pass?"

### Step 4: Success (RESOLUTION)

**Camera:** Full system view.

**What the viewer sees:**
- Both entities glow with gold accent — the whole system succeeded
- A "13/13 PASS" success badge on the Dev VM pulses
- SSH connection pulses completely (full circuit complete)
- Return path fully lit — result successfully returned to CyberClaw
- Status dots on CyberClaw show completion
- Overall scene feels "resolved" — warm, complete, satisfied

**What it communicates:** "After 6+ hours and 11 iterations, all 13 tests pass autonomously."

---

## Visual Principles

1. **Agent vs Infrastructure:** CyberClaw must read as an intelligent agent (floating, orbit ring, "eye" icon). Dev VM must read as infrastructure (grounded, static, muted borders). The SSH connection is the bridge between them.

2. **Progressive disclosure:** Don't show all detail at once. automate_loop's 3-stage detail is only visible during Step 2 zoom. At other steps, it's collapsed to avoid cognitive overload.

3. **Consistent highlighting:** Active sub-regions use the same gold accent color (#C9A227) with emissive glow. Inactive regions use the muted palette (#CFCBC0). Transitions should be smooth (~500-700ms spring-based).

4. **Particles communicate data flow:** Particles always travel in the direction of data/command flow. SSH particles go from CyberClaw → VM. Stage particles flow DIAGNOSE → PLAN → IMPLEMENT. Return path particles go from VM → CyberClaw.

5. **Camera movement is minimal and purposeful:** Only one camera transition (zoom into VM for Step 2, zoom back out for Step 3). No gratuitous orbiting or rotation. The camera serves the narrative.

6. **Color palette unchanged:** Gold (#C9A227), muted (#CFCBC0), ink (#1A1A1A), cream (#F5F3EC). No new colors. The existing palette is strong.

7. **Not sci-fi, not cringe:** No bloom post-processing, no laser beams, no holographic effects. Clean, technical, understated. The impressiveness comes from the clarity of what's being communicated, not from visual noise.

---

## Verification

After implementation, visually verify:

1. **Full system view:** Both entities visible, appropriately sized, clearly distinguishable as agent vs server
2. **Step 0:** CyberClaw glows, SSH particles travel, VM is dim
3. **Step 1:** Orchestrator sub-region highlights, status dots animate
4. **Step 2:** Camera smoothly zooms into VM, automate_loop stages visible and light up sequentially, CyberClaw fades
5. **Step 3:** Camera zooms back out, validator highlights, converging particles
6. **Step 4:** Both glow, success badge pulses, circuit feels complete
7. **Transitions:** All step transitions are smooth, no jarring snaps
8. **Mobile:** The diagram still works on mobile (stacked layout in ScrollStory)
9. **Performance:** No frame drops — particle count should be modest (< 20 total)
10. **Scroll sync:** Steps still trigger correctly via IntersectionObserver sentinels
