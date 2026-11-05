# STEMMate Namibia — Tailwind v0.2.1 (Architecture-Aligned)

Offline-first STEM session planner. This version upgrades the original Tailwind
app to fully match the Group 20 A4 architecture (PlanStore, BrowserPlanStore,
SyncManager with outbox + idempotency keys, full state machine, conflict
resolution, ConnectivityMonitor, data-saving mode, activities.json).

## Quick start

```bash
cd stemmate-tailwind-v2
python -m http.server 8080
```

Open **http://localhost:8080/** — sign in (pre-filled `FAC-NAM-704` / `1234`).

## File structure (5 files)

```
stemmate-tailwind-v2/
├── index.html        Complete app (Tailwind CSS + vanilla JS, self-contained)
├── activities.json   Read-only activity catalogue (loaded on first run, cached)
├── sw.js             Service worker (caches app shell + CDN for offline)
├── manifest.json     PWA manifest
└── README.md         This file
```

## What's new in v0.2.1 (architecture alignment)

| Element | Status | Where |
|---------|--------|-------|
| **PlanStore interface** (ADR-2) | ✅ Added | `PlanStore` object in JS — abstract contract |
| **BrowserPlanStore** (ADR-2 / Fig 7a) | ✅ Added | `BrowserPlanStore` object — localStorage implementation |
| **SyncManager** with enqueue/sync/retry/resolve (ADR-3) | ✅ Added | `SyncManager` object — full outbox engine |
| **OutboxItem** with idempotencyKey, attempts, lastError, serverVersion (Fig 7a) | ✅ Added | Each queued item has all 5 fields |
| **State machine** Pending→Syncing→Synced/Failed/Conflict (Fig 6) | ✅ Added | `SyncManager._syncOne()` implements all transitions |
| **Conflict resolution** Keep mine / Use server / Review (ADR-4) | ✅ Added | Side-by-side modal dialog |
| **Retry with same idempotency key** (ADR-3 / Fig 5) | ✅ Added | `SyncManager.retry()` resends same key |
| **Keep offline** (Failed → Pending) | ✅ Added | `SyncManager.keepOffline()` |
| **activities.json** (Fig 2/4) | ✅ Added | External JSON file, cached in localStorage |
| **Data-saving mode** (SR-02) | ✅ Added | Settings modal toggle |
| **ConnectivityMonitor** (Fig 3) | ✅ Added | Auto-triggers sync on reconnect |
| **Save Activity for Offline** (FR-02) | ✅ Added | Button on activity detail |
| **Validation** as separate module (Fig 3) | ✅ Added | `Validation.validatePlan()` / `validateLogin()` |
| **SessionManager** with clearUser (ADR-5) | ✅ Added | Wipes user data on sign-out |
| **MockSyncService** (ok/conflict/failed) | ✅ Added | Simulated endpoint with 3 outcomes |
| **PlanService** (Fig 3) | ✅ Added | Saves drafts + plans, enqueues sync |
| **HeadcountService** (FR-04) | ✅ Added | Aggregate count only |
| **Export All** (ADR-2 backup) | ✅ Added | Settings → Export All Data (JSON) |

## Verified working (via automated browser test)

| Screen / flow | Status |
|---|---|
| Login (school ID + PIN) | ✅ |
| Catalogue (loads from activities.json, filters work) | ✅ |
| Activity Detail (with Save Offline button — FR-02) | ✅ |
| Plan Creator (seeds from activity, autosaves draft) | ✅ |
| Save & Queue for Sync → auto-syncs when online | ✅ |
| Sync Queue shows Pending → Syncing → Synced | ✅ |
| Settings: data-saving mode + force-fail + conflict sim toggles | ✅ |
| Conflict detection (simulated) → ⛔ Conflict badge | ✅ |
| Conflict Review dialog (side-by-side local vs server) | ✅ |
| Keep mine → resends with same idempotency key → Synced | ✅ |
| Sync queue badge in top banner + nav dot | ✅ |

## How to run

```bash
cd stemmate-tailwind-v2
python -m http.server 8080
# Open http://localhost:8080/
```

Sign in with the pre-filled credentials, then:
1. Browse activities → tap one → **Save Offline** → **Start a Session Plan**
2. Edit the plan → **Save & Queue for Sync** → auto-syncs if online
3. Go to **Sync Hub** to see the queue
4. Open **Settings** (⚙️) → enable "Simulate sync conflict" → create another plan
5. Go to Sync Hub → tap **Review** on the conflicted item → side-by-side dialog
6. Disable conflict sim in Settings → tap **Keep mine** → resolves to Synced
