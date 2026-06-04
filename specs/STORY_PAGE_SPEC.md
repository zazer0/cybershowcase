# STORY SPECIFICATION - CHUNKED PLAN FOR PAGE REPRESENTATION

## Required Page Content

> Note: must use EXACT quotes from below; only the way they're represented in the UI is flexible.

### Minimal Hero Section
• Main heading: "Overnight Engineering - Guaranteed Correctness"
• Key capabilities list:
- Self-orchestrated debugging & repair
- AI agent reasoning and code fixing
- Continuous monitoring & validation
- Full automation from failure to success

Essential Note: this hero MUST BE NARROW so that the functionality walkthrough is halfway loaded; the "Step0 Walkthrough" should take up the entire bottom half of the viewport when they are at the top of the page, so that the user merely has to scroll a half page to fully-transition into the Functionality Walkthrough Step0 entirely.

### Functionality Walkthrough Section

Note: throughout all of these, there should be a persistent "simplified functionality-representation system diagram" on the left, which remains statically positioned on user's page as they scrolls through the Steps; however should update dynamically to 'highlight' the active Step component inside of itself as they progress through Steps.

**Step 0 - User Input**
• User instruction: "Please fix the deployment so it passes all of the e2e user story tests"
• Skills Activate note: "Agent knows to SSH into relevant dev VM, and reads the relevant SoP restriction that editing e2e user story tests is strictly prohibited"
**Step 1 - Orchestration**
• Timeline event: "Agent checking logs of prior engineering run"
• Skills Activate note: "Agent knows to commit current repo state if positive progress made - else, it leaves the repo state uncommitted, just 'resetting the deployed infra state for a fresh run' and then spawning another coding agent through automate_loop.sh"
**Step 2 - Diagnosis & Fix (Zoomed View)**
• Timeline event: "Automate_loop.sh executing its 3-stage process: 'investigate error and determine rootcause' + 'plan fix steps required' + 'implement specified plan' - with plan file force-written to deterministic location so 3rd step always picks it up correctly"
• Skills Activate note: "Calling automate_loop.sh with relevant paths + a succinct summary of the prior agent's goal"
**Step 3 - Validation**
• Timeline event: "System validates progress through pipeline using solution.sh script"
• Skills Activate note: "Orchestrator behavior: if prior coding CLI succeeded, runs solution.sh to determine current progress and saves result in error_output location; if prior coding CLI failed, skips validation as spawned agent will handle it"
**Output Step - Success**
• Outcome: "Successfully completed 13/13 exploit chain steps after 6+ hours of autonomous operation"
• Skills Activate note: "Agent delivers complete success without human intervention"

## Other Misc Notes, Essential for Page/Goals

**Interactive Elements (as specified in additional context):**
• Timeline/Interactive UI: Should be scrollable with smooth transitions between steps
• Transcript quotes: Direct quotes from session transcripts (fix-loop-sccmhunter-diagnosis.jsonl) to demonstrate actual AI reasoning
• Visual walkthrough: Each step should show a concrete example from the transcript timeline
• System behavior enforcement: Visual representation of "Skills Activate" behaviors that occur without explicit human instruction
• Progression visualization: Clear demonstration of the 6+ hour autonomous operation from failure to success

**Key Artifacts to Reference:**
• Session transcripts: fix-loop-sccmhunter-diagnosis.jsonl (142 messages, Mar 3)
• Cron logs: Showing ~6 hours of autonomous operation (cron-log-2026-02-28.md and cron-log-2026-03-01-onward.md)
• Worklogs: Documenting each fix iteration (goad-worklogs/001-009.md)

**Core Functionality to Showcase:**
• Autonomous overnight engineering: System spawns coding agents at intervals
• Self-orchestrated process: Run→fail→fix→retry with validation against human-configured objectives
• Human oversight balance: Validation ensures correctness while maintaining full autonomy
• Impressive achievement: 10+ iterations over ~6 hours achieving full 13/13 exploit chain success without human intervention
