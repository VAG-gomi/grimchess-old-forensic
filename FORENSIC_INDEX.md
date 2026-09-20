# Forensic Index

| Question | Start here | Evidence boundary |
|---|---|---|
| Which APKs are preserved? | [`evidence/EVIDENCE_MANIFEST.md`](evidence/EVIDENCE_MANIFEST.md) | APK hashes and metadata are verified from the available files. |
| Which file controls the chess engine? | [`recovered-source/grimchess-mobile/src/engine/stockfish.ts`](recovered-source/grimchess-mobile/src/engine/stockfish.ts) | Verified from recovered source; APK relationship is not independently proven. |
| Where is Stockfish? | [`recovered-source/grimchess-mobile/public/stockfish/`](recovered-source/grimchess-mobile/public/stockfish/) | Recovered source assets; APK-embedded copies are not treated as source originals. |
| Which file defines Android build settings? | [`recovered-source/grimchess-mobile/android/app/build.gradle`](recovered-source/grimchess-mobile/android/app/build.gradle) and [`recovered-source/grimchess-mobile/android/variables.gradle`](recovered-source/grimchess-mobile/android/variables.gradle) | Verified from recovered source. |
| Where is the old UI behavior? | [`recovered-source/grimchess-mobile/src/App.tsx`](recovered-source/grimchess-mobile/src/App.tsx) and `src/components/` | Verified from recovered source. |
| What defines paradox/prediction behavior? | [`recovered-source/grimchess-mobile/src/simulator/paradox/`](recovered-source/grimchess-mobile/src/simulator/paradox/) | Verified from recovered source. |
| Which files are recovered rather than reconstructed? | [`PROVENANCE.md`](PROVENANCE.md) | Status labels are explicit; no source-to-APK production claim is implied. |
| How could the build be studied? | [`BUILD_RECONSTRUCTION.md`](BUILD_RECONSTRUCTION.md) | Reconstruction is bounded by missing original build transaction metadata. |
| What remains unknown? | [`INVESTIGATION_STATUS.md`](INVESTIGATION_STATUS.md) | Unknowns are not filled by inference. |
