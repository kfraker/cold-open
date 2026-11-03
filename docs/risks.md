# Risks

The biggest unknowns, and how each is handled. Technical unknowns get a timeboxed, throwaway spike before the work that depends on them.

| # | Risk | Likelihood / impact | How it's handled | Status |
|---|---|---|---|---|
| R1 | A page-accurate view inside a rich-text editor is too slow or too complex | Medium / High | **Spike 0.S:** TipTap plus a prototype layout engine paginate a 150-page sample, with typing latency measured against the 50 ms target. If it fails, change approach before Epic 2 (for example, paginating a separate preview instead of the editing surface). | Open |
| R2 | The page view and the PDF disagree on page breaks | Medium / High | One layout engine drives both. Tests compare page counts and break positions. | Designed out |
| R3 | The FDX format isn't fully documented | Medium / Medium | Build from sample files. Check exports open in Final Draft's free trial or a free FDX reader. Log any gaps as known limitations. | Open |
| R4 | Formatting rules differ between sources | High / Medium | Each built-in type cites one public formatting guide as its reference, recorded in its definition. | Open |
| R5 | Offline edits conflict with the server copy | Low / High | Version-checked saves and an explicit choice dialog. Nothing is overwritten silently. Browser tests cover it. | Designed out |
| R6 | Free-tier limits are reached (Neon storage, Sentry events) | Low / Medium | Compressed, thinned-out revisions; usage tracked in [services.md](services.md). | Monitored |
| R7 | TipTap's free, open-source parts lack something needed | Low / Medium | Use ProseMirror directly for any missing piece. Paid extensions are ruled out. | Open |
| R8 | Phone editing is awkward without Tab and Enter shortcuts | Medium / Low | Toolbar element picker; tested on phone sizes and a real phone. | Open |
| R9 | Test samples infringe copyright | Low / Medium | Sample scripts are written for this project or are in the public domain. Copyrighted scripts are never used. | Designed out |
