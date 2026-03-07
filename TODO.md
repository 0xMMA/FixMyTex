# KeyLint — Feature Parity TODO

Audit of gaps between v1 (Rust/Tauri) and v2 (Go/Wails).
Focus: the two core features — **Silent Fix** and **Pyramidize**.

---

## System Tray & Window Lifecycle

- [ ] **Minimize to tray on close** *(v4.0.0-alpha finding)* — closing the window should hide it to the
      system tray rather than quit. Currently `ApplicationShouldTerminateAfterLastWindowClosed: true`
      in `main.go` causes full exit. Fix: set to `false`, intercept window-close event, and call
      `window.Hide()` instead. Tray menu already has "Exit" for intentional quit.

- [ ] **Tray icon click / double-click brings window to front** *(v4.0.0-alpha finding)* — clicking or
      double-clicking the tray icon should show and focus the window. The "Open KeyLint" menu item
      calls `tray.ShowWindow()` but the icon itself has no click handler. Add
      `tray.OnClick` / `tray.OnDoubleClick` in `internal/features/tray/service.go`.

---

## Silent Fix

- [ ] **Auto-paste to source app** *(#1 priority — v4.0.0-alpha confirmed broken)* — after writing
      fixed text to clipboard, send Ctrl+V back to the originally focused window.
      Windows: Win32 `SendInput` (v1 used `system_utils.rs` `SendInput()`).
      Linux: `xdotool key ctrl+v`.
      The Fix component already writes the result to clipboard (`wails.writeClipboard`) but never
      sends the keystroke, so the result never reaches the source application.

- [ ] **Linux hotkey** — currently a no-op stub (`service_linux.go`). Wire up a real global
      shortcut (e.g. `github.com/robotn/gohook` or `xbindkeys` integration).

- [ ] **HTML clipboard support** — detect foreground app (Outlook, Word, LibreOffice, etc.),
      convert Markdown output to HTML, write both CF_HTML and CF_TEXT to clipboard.
      v1 had `HtmlClipboardService` with app-name regex matching.

---

## Version & Updates

- [ ] **Version + update indicator in main nav** *(v4.0.0-alpha finding)* — display the app version
      in small text at the bottom-left of the shell nav alongside a single icon that lights up when
      an update is available. Clicking the icon (or version text) should navigate to Settings → About.
      The version string is already available via `wails.getVersion()`; update status via
      `wails.checkForUpdate()`. Currently only visible in Settings → About.

---

## Pyramidize (Advanced Mode)

The current `TextEnhancementComponent` is a single-pass generic fix with no pyramidal logic.
The entire v1 `PyramidalAgentService` pipeline needs to be rebuilt in Go + Angular.

### Pipeline (Generate → Specialists → QA)

- [ ] **Document type detection** — LLM classifies input as EMAIL / WIKI / POWERPOINT / MEMO
      (or user selects manually). Returns `{type, language, confidence}`.

- [ ] **Oneshot foundation generator** — document-type-specific prompt templates (German + English)
      that convert raw text into a structured document: subject + headers + body.
      Output: `{subject, headers[], fullDocument, documentType, language}`.

- [ ] **Parallel specialist agents** — run concurrently after the foundation step:
  - Subject Line Specialist — validates format + information density
  - Header Structure Specialist — MECE principle + pyramidal hierarchy
  - Information Completeness Specialist — detects info loss vs original
  - Style & Language Specialist — tone, consistency, professional polish
  - Each returns a confidence score (0.0–1.0).

- [ ] **Integration coordinator** — selectively applies specialist improvements where
      confidence > 0.7; preserves baseline on low-confidence suggestions.

- [ ] **Quality assurance check** — final pass returns
      `{informationLoss[], accuracyIssues[], missingElements[], overallScore, passed}`.

### UI Controls (missing from v2)

- [ ] Document type selector (AUTO / EMAIL / WIKI / POWERPOINT / MEMO)
- [ ] Communication style selector (concise / detailed / persuasive / neutral /
      diplomatic / direct / casual / professional)
- [ ] Relationship level selector (formal / professional / casual / friendly)
- [ ] Custom instructions textarea
- [ ] Markdown rendering for output (replace readonly `<textarea>`)
- [ ] Editable output (allow manual tweaks after AI generation)
- [ ] Tab view: Draft vs Original

### Clipboard integration

- [ ] **HTML clipboard paste-back** — same as Silent Fix: convert Markdown output to HTML
      and paste to source app with proper MIME types.

---

## Priority Order

1. **Auto-paste to source app** — the single most important missing feature; silent fix is broken without it
2. **Minimize to tray on close** — app is unusable as a background tool without this
3. **Tray icon click brings window to front** — standard tray UX expectation
4. **Version + update indicator in nav** — polish / discoverability
5. Pyramidize pipeline (core value proposition)
6. Pyramidize UI controls
7. Linux hotkey
8. HTML clipboard support
