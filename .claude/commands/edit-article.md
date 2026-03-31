## Step 1 — Parse structure and confirm

Divide the article into sections based on its headings. Treat the content as a directed acyclic graph: some sections depend on concepts introduced in earlier ones. Verify that the section order respects those dependencies — reorder if it does not.

List the sections and their intended purpose. Confirm with the user before proceeding. If the user wants to add, remove, or reorder sections, do it now.

## Step 2 — Rewrite each section

Work through sections in dependency order (foundations before dependents). For each section apply these rules:

- **Prose paragraphs:** Rewrite for clarity, coherence, and forward flow. Hard limit: 240 characters per paragraph. Split anything longer.
- **Code blocks:** Do not touch. Preserve exactly.
- **Lists:** Tighten wording — remove filler phrases, make items parallel. Do not change meaning.
- **Headings:** Check hierarchy (H2 before H3, no skipped levels). Reword if the heading is vague or misleading.

After finishing each section, note what changed and why (one line per section).

## Step 3 — Cross-section review

Read the article end-to-end after all sections are rewritten. Check:

1. Does the opening section frame what follows? Does the closing section land the point?
2. Are there transitions between sections, or do they feel like disconnected chunks?
3. Is any concept explained more than once? If so, keep the best explanation and cut the rest.
4. Are there contradictions between sections?

Fix any issues found in this pass.

## Step 4 — Show diff and wait for approval

Present a summary of all changes made, organized by section. For each section: one sentence describing what changed (e.g. "Split 3 long paragraphs, removed redundant intro sentence, tightened list wording"). For structural changes (reordered sections, merged sections), call those out explicitly.

Do not write anything to the file yet. Wait for the user to approve or request adjustments.

## Step 5 — Apply and confirm

Once the user approves, apply all changes using the Edit tool, section by section. Confirm to the user when done. If any section failed to apply cleanly (e.g. the original text had changed), flag it and show the intended edit so the user can apply it manually.
