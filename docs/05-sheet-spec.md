# SAIRA: Sheet Specification (the most important document)

The sheet is the core of the product. Build it first and make it excellent before touching reminders, quotes or the landing page.

## 1. Source of truth for content

- `data/sheet.seed.json` (bundled) defines all phases, topics, subtopics and practice items.
- `05b-sheet-outline.md` is a readable dump of the same data. If they ever disagree, the JSON wins.
- IDs look like `p2-arrays`, `p2-arrays.3`, `p2-arrays.pr1`. **Never rename or reuse an id**; when content changes, bump `schemaVersion` and add new ids.

### Tags (same flow as the earlier roadmap chat)
- `K` = in Kunal Kushwaha's DSA bootcamp syllabus
- `S` = in Striver's A2Z sheet
- `+` = added, in neither source line

### Verification status (be honest in the UI)
| Content | Status |
|---|---|
| Phase/topic structure and tags | From the earlier roadmap chat; consistent with Striver's 20 live sections |
| Striver section counts | **Verified** from the live page (total 495, list in the seed's `verification`) |
| Individual Striver problem names | **Not verified**: the live sheet is JavaScript-rendered and only headers loaded |
| Kunal video links and timestamps | **Not verified**: the syllabus file was unavailable; the repo README only links the lecture playlist |
| `practice` items | Generic, well-known problem names used as **candidates** (`verified:false`, no links) |
| `expanded:true` topics | Subtopic breakdown written from standard CS knowledge because the roadmap line only named the topic |
| OOP | Roadmap line lists 18 items; 5 `+` items bring it to the 23 the earlier Phase 0 sheet claimed |

The agent must not invent links, timestamps or claim "official" status. A `candidate` badge and an "Add my link" affordance are required.

## 2. Structure

```
Phase (6)  →  Topic (43)  →  Subtopic (262, learning checklist)
                          →  Practice item (119 candidates, problems to solve)
```
Seed totals right now: **6 phases, 43 topics, 262 subtopics, 119 practice items**. Percentages count subtopics and practice items equally (one unit each). Provide a toggle "Count: all / subtopics only / practice only".

Phase accents (see design system): P0 sky, P1 amber, P2 violet, P3 emerald, P4 rose, P5 cyan.

Phase/topic notes in the seed (e.g. "Striver files backtracking inside Recursion", "DSU is under Striver's Graphs") appear as a small info line on the topic header.

## 3. Layout (desktop ≥ 1024 px)

1. **Top bar**: SAIRA mark, global search (Ctrl/Cmd-K), sync indicator, streak flame + count, avatar menu.
2. **Left rail** (sticky): "Overall" ring, then six phase cards (title, `done/total`, thin colour bar). Selected phase expands its topic list with mini-progress.
3. **Main**: Phase header (title, description, big % ring, "Continue" button, count toggle). Below, topic accordions:
   - Header: title, source tags `[K][S][+]`, `expanded`/`candidate` hint, `done/total`, progress bar.
   - Body: two groups: **Learn** (subtopics) and **Practice** (problems).
   - Row: checkbox · title · source chip · status chip · link icons (video/article/practice) · bookmark · confidence dots · notes indicator · revise-on pill · `⋯` menu.
4. **Detail drawer** (right): all item fields (see §4). Open by clicking a row title or pressing Enter.
5. **Footer strip per topic**: "Mark all learn items done" (confirm), "Add item".

Mobile: left rail becomes a bottom sheet/drawer; rows stack (title on top, chips below); detail opens full-screen.

## 4. Item fields and behaviour

| Field | UI | Rules |
|---|---|---|
| Status | checkbox + chip menu | `not_started → in_progress → done → needs_revision`. Checkbox toggles `done`/`not_started`. Done sets `completedAt` and writes today's `DayLog.completed += 1` (decrement if undone the same day) |
| Confidence | 5 dots | 1 = shaky, 5 = could teach it. Rating ≤ 2 on done flags `needs_revision` suggestion |
| Key idea | one-line text | shown under title when set |
| Mistakes I made | short text | shown in Revision |
| Notes | markdown editor | autosave debounce 600 ms, ≤ 20k chars |
| Links | video / article / practice URLs | validate `https://`; open in new tab with `rel="noopener noreferrer"` |
| Minutes | number + "Start timer" | timer persists across reloads; adds to `DayLog.minutes` |
| Attempts | counter | |
| Bookmark | star | |
| Hidden | menu | excluded from %; "N hidden" chip with unhide |
| Revision | pill | after `done`, `revision.step = 0`, due = today + 1 day (see tech doc intervals) |

Every change updates `updatedAt` and `lastTouchedAt` (used by "Continue").

## 5. Interactions that must exist

- **Optimistic ticks** with undo toast.
- **Continue**: first not-done item in order within the current phase; if phase complete, next phase.
- **Keyboard**: `j/k` move, `x` toggle done, `Enter` open, `n` notes, `b` bookmark, `/` or Ctrl/Cmd-K search, `g t` Today, `g s` Sheet.
- **Filters** (persist per session): status, source tag, due for revision, bookmarked, confidence ≤ 2, has notes.
- **Search**: titles + notes + keyIdea; results grouped by phase; selecting jumps and highlights.
- **Add custom item**: modal (kind, parent, title, optional links). Custom items get ids like `u-<nanoid>` and are stored in `users/{uid}/custom/{id}`.
- **Edit a seed item's title or links**: stored as an overlay (`progress.titleOverride`, `links`), never mutating the bundled seed.
- **Export / import** (JSON v1): includes progress, custom items, days, settings.
- **Milestones**: finishing a topic or phase triggers a celebration (confetti ≤ 1.5 s, respects reduced motion) and a milestone quote.

## 6. Derived numbers shown on the sheet

Overall %, per phase %, per topic %, `done/total`, remaining, **"≈ N days to finish at your pace"** (from `pace`), items completed today, current streak. All computed with the pure functions in `src/lib/stats`; none hard-coded.

## 7. Empty, loading, error states

- First run: "0 of 262 learned · 0 of 119 solved. Start with Phase 0: Git and GitHub." with a Continue button.
- Loading: skeleton rows, no spinners over content.
- Offline: banner "Offline: changes will sync" and nothing blocks.
- Sync error: non-blocking toast with retry; data stays local.

## 8. Content maintenance (post-launch task, not a blocker)

Provide an admin-free way to improve content: the learner edits links/titles in the UI, and can import a JSON patch file `{ itemId: { title?, links? } }`. A script `pnpm seed:verify` should list items with `verified:false` and no links so the learner can fill them in section by section against Striver's live sheet and Kunal's playlist.

## 9. Acceptance for the sheet milestone

1. Seed loads; counts equal 6/43/262/119.
2. Tick 5 items, reload: still ticked; refresh on another device: ticked.
3. Percentages match a manual count in a unit test over the seed.
4. Undo works; notes autosave and persist; search finds a note word.
5. Custom item added, edited, hidden; hidden items excluded from % and counted in the chip.
6. Works offline (airplane mode), syncs on reconnect.
7. 360 px and 1440 px layouts both usable; keyboard-only flow completes a tick.
