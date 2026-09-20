# File Purpose Map

## Evidence objects

The four files under `artifacts/apk/` are byte-preserved APK evidence objects. Their stable IDs, original observed locations, sizes, hashes, package metadata, and signer details are in [`evidence/EVIDENCE_MANIFEST.md`](evidence/EVIDENCE_MANIFEST.md).

## Recovered source

`recovered-source/grimchess-mobile/src/App.tsx` is the old application entry point. `src/engine/stockfish.ts` contains the engine worker integration. `src/simulator/StockfishAdapter.ts` adapts engine analysis to the simulator. `src/simulator/paradox/` contains prediction and contradiction logic. `src/components/` contains UI components.

`recovered-source/grimchess-mobile/public/stockfish/` contains the recovered JavaScript and WebAssembly engine assets. `android/app/build.gradle`, `android/variables.gradle`, `android/build.gradle`, `android/settings.gradle`, and `gradle/wrapper/` are the Android build inputs.

## Status rule

A file under `recovered-source/` is preserved from the available source archive and is labelled `VERIFIED_FROM_RECOVERED_SOURCE`. That label does not prove that the file produced any particular APK. Generated `dist/`, Gradle build outputs, dependency directories, and APK copies inside the source archive were excluded because they are generated or separately preserved evidence.
