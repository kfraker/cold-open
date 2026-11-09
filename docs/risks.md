# Risks

The biggest unknowns, and how each is handled. Technical unknowns get a timeboxed, throwaway spike before the work that depends on them.

| # | Risk | Likelihood / impact | How it's handled | Status |
|---|---|---|---|---|
| R1 | A page-accurate view inside a rich-text editor is too slow or too complex | Medium / High → Low / Medium | [Spike 0.S](spikes/0S-layout.md) proved the approach: under 50 ms in all three engines, and the page view matches the engine line for line. Page breaks are recalculated when typing pauses. **Known limit:** on budget hardware (4× slower), typing in a full-length script reaches about 60–75 ms, mostly the editor's own cost. The 4× result is reported in CI so it stays visible. If it becomes a problem, render the script in separate sections. | Monitored |
| R2 | The page view and the PDF disagree on page breaks | Medium / High | One layout engine drives both. Tests compare page counts and break positions. | Designed out |
| R3 | The FDX format isn't fully documented | Medium / Medium | Build from sample files. Check exports open in Final Draft's free trial or a free FDX reader. Log any gaps as known limitations. | Open |
| R4 | Formatting rules differ between sources | High / Medium | Each built-in type cites one public formatting guide as its reference, recorded in its definition. | Open |
| R5 | Offline edits conflict with the server copy | Low / High | Version-checked saves and an explicit choice dialog. Nothing is overwritten silently. Browser tests cover it. | Designed out |
| R6 | Free-tier limits are reached (Neon storage, Sentry events) | Low / Medium | Compressed, thinned-out revisions; usage tracked in [services.md](services.md). | Monitored |
| R7 | TipTap's free, open-source parts lack something needed | Low / Medium | Use ProseMirror directly for any missing piece. Paid extensions are ruled out. | Open |
| R8 | Phone editing is awkward without Tab and Enter shortcuts | Medium / Low | Toolbar element picker; tested on phone sizes and a real phone. | Open |
| R9 | Test samples infringe copyright | Low / Medium | Sample scripts are written for this project or are in the public domain. Copyrighted scripts are never used. | Designed out |
