# Map rendering benchmark

Repeated filter updates previously rebuilt the marker layer and animated unchanged zoom levels. The map now retains its sprites and spatial index, so these updates need one redraw. KDBush selects nearby sprites for the Pixi container. SVI and date filters still use the full case list.

## Measurements

Measured on 2026-10-15 with agent-browser 0.26.0 and Chrome for Testing 148.0.7778.97. Each operation has seven samples. The table shows medians in milliseconds.

| Operation                            | Before | After | Reduction |
| ------------------------------------ | -----: | ----: | --------: |
| Pan, time to final render            |  253.1 |   0.7 |     99.7% |
| Filter, time to final render         |  581.1 |   9.5 |     98.4% |
| Zoom, time to final render           |  252.9 | 251.1 |      0.7% |
| Zoom, CPU time inside renderer calls |  186.1 |  81.6 |     56.2% |

The fixture uses 10,000 deterministic cases, one marker style, and a 1200 × 700 map. It uses the actual Leaflet, Pixi, and map hooks. It excludes API requests and tile downloads. The baseline contains the workspace changes present before this optimization, based on commit `31aace48`.

Both browsers use `--disable-gpu-vsync,--disable-frame-rate-limit` because the locked display otherwise stops animation frames. The final benchmark runs execute separately. These flags allow more frames than a normal display, so zoom CPU totals do not predict normal refresh-rate performance. Zoom deliberately retains its 250 ms animation.

Pan render calls fall from a median of 129 to 1. Filter render calls fall from 236 to 1. The interaction fixture attaches 325 nearby sprites while retaining all 10,000 for filters. These results establish an improvement for this workload, not a production latency guarantee.

Raw samples: [before](results/map-before.json) and [after](results/map-after.json). `synchronousMs` measures the action call. `untilLastRenderMs` measures elapsed time through the final renderer call. `renderMs` sums CPU time inside renderer calls and excludes asynchronous GPU completion. Measurements reject operations that render no frames.

## Reproduce

Start the repository with Node 20 and `pnpm dev`. Open the fixture with agent-browser:

```sh
agent-browser --session map-perf --args '--disable-gpu-vsync,--disable-frame-rate-limit' open http://localhost:8080/test/performance/map-rendering.html
agent-browser --session map-perf wait --fn '!!window.benchmark'
agent-browser --session map-perf eval 'benchmark.run()'
agent-browser --session map-perf close
```

Use the same fixture and browser flags for both versions. Run one benchmark at a time with builds and other test workloads stopped. The fixture alternates 80-pixel pans, all/half selection filters, and zoom levels 12/13. It waits for rendering to settle without including the idle tail in elapsed results.

## Verification

The focused map tests pass: 21 tests across four files. The browser fixture passes 13 interaction checks, including culling, filter persistence, texture loading, zoom thresholds, coordinate updates, and layer reuse. See [browser results](results/browser-checks.json).

The signed-in Work page uses a demo incident with 876 cases. SVI filtering reduces attached sprites from 813 to 327. Date filtering reduces them to 437. Clearing filters restores 813. Reload keeps the same layer, canvas, and viewport. Zoom to Interactive renders 803 detailed markers with valid textures.

Table-to-map navigation restores zoom and center within one screen pixel. Hover identifies the expected case, and a DOM click on its canvas opens the correct case details. Native pointer commands did not select the case on the locked Mac, so the selection check dispatches DOM mouse events through Leaflet.

Production bundling succeeds with `SENTRY_AUTH_TOKEN` empty, which skips external source-map upload. Changed source files pass ESLint with `--quiet`, and formatting passes.

The isolated PR checkout has 930 passing tests, no failing tests, and one failing snapshot. The snapshot concerns generated form data and also fails in the original workspace. Typecheck still fails with 2,432 diagnostics, primarily unresolved Vue exports. The original workspace has 2,438 diagnostics. The comparison finds no new diagnostic text in the changed files.
