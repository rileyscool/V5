# Future refactor targets

These are intentionally larger than the current low-risk simplification pass. They need runtime checks in ChatTriggers before changing behaviour.

## Shared runtime

- [ ] Extract the repeated vector/position coercion rules from `utils/Utils.js`, `utils/Math.js`, and pathfinding only after documenting the accepted ChatTriggers wrapper types.
- [ ] Give `utils/Constants.js` focused platform, Java I/O, Minecraft, and protocol modules; retain its public re-exports during migration.
- [ ] Replace the mutable singleton fields in `MacroState` with a single session record if macro lifecycle changes continue to grow.
- [ ] Consolidate macro keybind persistence in `ModuleBase` and `MacroState` behind one configuration write path.
- [ ] Make `ScheduleTask` cancellation-aware if delayed module actions need to be cancelled on world unload.
- [ ] Establish one error-reporting helper for the repeated `V5 Caught error` logging pattern.
- [ ] Move blocking remote item/price loading out of module construction and give it bounded cache expiry/retry behaviour.
- [ ] Define a single HTTP/download abstraction for `FileUtils`, `gui/Utils`, music, and clipping downloads.
- [ ] Audit every Java thread touching client state; client callbacks should return through the Minecraft execute queue.
- [ ] Put platform notification process handling behind a capability check and cleanly reap launched processes if this becomes a leak source.
- [ ] Replace reflection in `Sign` with a loader-supported access route if the engine exposes one.
- [ ] Document the lifetime/ownership contract for `Mixin` keys so camera, ungrab, macro, and packet features cannot overwrite each other.
- [ ] Move the unfinished `backend/RemoteControl.js` protocol from placeholder to an explicit no-op contract before adding callers.

## Pathfinder and movement

- [ ] Break `utils/pathfinder/PathFinder.js` into search state, graph expansion, path selection, and rendering diagnostics.
- [ ] Isolate `EtherwarpPathfinder` candidate generation from execution so route planning can be inspected without moving the player.
- [ ] Unify duplicate walker/flyer rotation smoothing rules under a shared, tested rotation primitive.
- [ ] Merge the walker/flyer prediction modules only after confirming their movement semantics are genuinely identical.
- [ ] Make `PathExecutor` own callback deregistration/cancellation scopes rather than requiring each path mode to clear itself.
- [ ] Replace pathfinder configuration’s mutable ALL_CAPS instance fields with normal settings accessors while retaining GUI persistence.
- [ ] Split `PathSpline` construction, interpolation, and debug rendering.
- [ ] Centralize AOTE/AOTV cooldown and packet sequencing across `PathAote`, Etherwarp, and pathfinder integrations.
- [ ] Add a route-data schema/version migration path before changing saved route formats.

## Mining

- [ ] Split `MiningUtils.js` by block metadata, tool state, mining-speed calculation, and world queries.
- [ ] Extract the explicit state machines embedded in `MiningBot`, `CommissionMacro`, and `GlaciteCommissionMacro` before extending them.
- [ ] Make route ownership explicit between Gemstone, Ore, and RouteWalker instead of sharing mutable global route state.
- [ ] Consolidate duplicate route load/save/edit code among mining macros without deleting planned route formats.
- [ ] Compare Gemstone and Ore face-target/etherwarp retry semantics, then extract only the common geometry once their arrival thresholds and packet timing are documented.
- [ ] Move mining packet/action scheduling behind a single rate-limited queue; preserve each macro’s existing timings first.
- [ ] Audit `NukerUtils` and macro packet paths against the current V5 Loader protocol mappings before simplifying packets.
- [ ] Separate commission parsing/data from commission execution in `CommissionMacro`.
- [ ] Make tunnel/path calculation limits configurable per algorithm instead of one global threshold if profiling proves it needed.
- [ ] Isolate crystal-hollows area data and world scanning from macro-specific target selection.

## Farming, foraging, combat, skills, and other macros

- [ ] Establish a common macro lifecycle checklist around `ModuleBase` before migrating the many independently-written state machines.
- [ ] Consolidate crop movement primitives used by the farming row/shape macros only after comparing recovery behaviour.
- [ ] Split `VisitorMacro` inventory interaction from visitor selection and chat parsing.
- [ ] Split `PeltMacro` route logic, entity selection, and inventory actions.
- [ ] Isolate `CombatBot` targeting, rotations, and attack packets.
- [ ] Make ForagingBot’s target acquisition and movement decisions independently inspectable.
- [ ] Extract recurring GUI-sign/container waits in Bazaar, Mousemat, farming, and skill macros into a small state-transition helper if their timeout rules converge.
- [ ] Re-evaluate experimental/developer-only module loading behind an explicit feature gate rather than commented imports.
- [ ] Audit every macro’s world-unload, limbo, and failsafe recovery interaction as one lifecycle matrix.

## GUI and failsafes

- [ ] Split `gui/Utils.js` into rendering, layout/input, remote data, and file cache modules.
- [ ] Consolidate duplicated component layout/state handling across GUI component files only after preserving keyboard and mouse focus edge cases.
- [ ] Make category search/filtering a pure data transform, then keep rendering thin.
- [ ] Separate GUI saved-state parsing/migration from immediate UI updates in `GuiSave`.
- [ ] Give overlays an explicit owner module and cleanup contract to prevent stale timers/positions.
- [ ] Extract shared failsafe detection/response state from individual implementation files while preserving priority ordering.
- [ ] Turn failsafe intensity escalation into a documented transition table before editing its thresholds.
- [ ] Make alert sound selection and desktop notification delivery independently configurable only if users need separate policies.
- [ ] Consolidate repetitive packet/chat registration guards in failsafes after a full event-order audit.

## Loader, data, and maintenance

- [ ] Replace commented module imports in loaders with a deliberate feature manifest once module maturity is tracked in data.
- [ ] Audit the asset/config bootstrap manifest for migration/version support before altering existing user files.
- [ ] Generate or validate protocol aliases in `utils/Packets.js` against V5 Loader mappings during loader upgrades.
- [ ] Add lightweight static lint/format commands only if the project adopts a package manifest; do not add a build system solely for this.
- [ ] Maintain this ledger as each item becomes runtime-verified work; remove entries only after the migration is complete.
