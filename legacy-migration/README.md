# Legacy Migration / Normalization

This is a one-time admission tool, not vNext Core runtime behavior.

Run `normalize-legacy-project.cjs --write --source-base <verified legacy commit>` in a clean legacy project. It records the supplied Git truth, freezes an unchanged copy of the historical `status.yml`, and commits both artifacts as the vNext-ready baseline. It never manufactures preflight, review rounds, or revised historical task state.

Before adopting vNext, run `--verify`. A missing, altered, uncommitted, or non-ancestral baseline fails admission. Once admitted, start new vNext tasks for new work; historical tasks remain historical facts.
