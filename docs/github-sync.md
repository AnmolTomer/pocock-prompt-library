# Sites and GitHub synchronization

Sites and GitHub have separate Git repositories. Publishing with Sites does not push to GitHub. Source updates must finish with both repositories updated.

## Targets

- Site: `appgprj_6ac63777a6248191be9a22df7318c481`
- Website: https://pocock-prompt-library.anmoltomer.com/
- GitHub: https://github.com/AnmolTomer/pocock-prompt-library
- Local checkout: `/Users/anmoltomer/Documents/code/personal-projects/pocock-prompt-library/site`
- Existing remote: `github`, using `git@AnmolTomer:AnmolTomer/pocock-prompt-library.git`
- Repository-local author and committer: `AnmolTomer <anmol3540@gmail.com>`

## After a Sites source update

1. Follow the installed Sites skill to open the current source for this exact Site. Use a fresh credential and the source helper in an empty scratch directory. Credentials stay in session memory and are passed through hidden stdin. Never store them in files, remotes, Git configuration, logs, or commit messages. Keep the Site ID, audience, database bindings, and existing app behavior unchanged.
2. Inspect the personal checkout and run `gh auth status`. Fetch `github/main`; fast-forward a clean checkout when possible. Stop and report local edits, conflicting history, or failed authentication. Never reset, clean, force-push, or assume an older checkout is authoritative.
3. Fetch the opened Sites source into the personal checkout as a local Git source so its commit and blobs can be compared. Find the last mirrored source SHA in the latest GitHub commit containing a `Sites-Source-Commit:` trailer. Compare that source snapshot with the current source. If no trailer exists, establish the baseline from an observed matching source tree; do not guess it.
4. Apply only the source changes since that baseline to GitHub. Preserve later GitHub changes. For a clean identical baseline, restore the explicitly reviewed changed paths from the source commit. Otherwise apply the source diff with three-way conflict detection. Stop on conflicts; do not choose one side automatically. Review all affected tracked files for secrets, unintended removals, generated output, and unrelated changes. Keep these instructions in both source repositories.
5. Run `git diff --check` and the checks relevant to the changed files. Application changes require `make check`, `make test`, and `make build`. Documentation-only synchronization needs no application or database test run. If no source changes remain, do not create an empty commit.
6. Stage only reviewed paths. Commit with a concrete description and a body trailer `Sites-Source-Commit: <exact opened source SHA>`. Push normally to `github main`, then confirm the remote SHA equals the intended GitHub commit and the worktree is clean. A rejected push requires fetching and reconciling; never force-push. Report partial success plainly if only one repository was updated.

For an update that starts in GitHub, reconcile and push the same source changes to the Sites source before publishing through the installed Sites workflow. Do not run an unattended bidirectional merge. Automated catch-up runs synchronize Sites source to GitHub and stop when divergence needs a decision.

## Scope and limitations

These instructions guide agents that read this repository; they are not a server-side hook. An optional local Codex automation can check for missed source changes. It depends on the Mac being available, the local checkout, and authenticated Sites and SSH access. Routine unchanged runs should remain quiet; report a new mirrored commit or a failure requiring action.

Synchronization copies tracked source. The live D1 database, collection history, runtime secrets, and local fixtures are separate. Do not export or commit them as part of source synchronization. The October 22 and 26 entries are in `lib/seed-prompts.ts`; other database-only content is not implied to be in GitHub.
