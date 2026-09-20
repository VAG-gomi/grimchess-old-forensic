# GrimChess Older APK Forensic Archive

This repository preserves older GrimChess APK evidence and the recoverable source/build inputs needed for forensic study. It is an evidence archive, not a repair, modernization, or Old-versus-Current comparison project.

## Repository roles and evidence chain

The GrimChess project is organized across three repositories with distinct roles:

1. [`grimchess-f1-forensic`](https://github.com/VAG-gomi/grimchess-f1-forensic) is the Current-version forensic evidence repository, including Current F1 runtime instrumentation. It is the authoritative source for Current F1 evidence and is not modified by this project.
2. `grimchess-old-forensic` (this repository) is the historical evidence repository. It is the authoritative source for the preserved Old APKs and recovered historical source/build evidence documented here.
3. [`grimchess-version-examination`](https://github.com/VAG-gomi/grimchess-version-examination) is the derived analytical and educational comparison repository. It consumes pinned evidence from the two authoritative repositories and must not be treated as a source-of-truth evidence archive.

The evidence chain is therefore **Current forensic evidence + Old forensic evidence → derived examination and comparison results**. Preserved evidence remains authoritative in its respective evidence repository; analytical outputs do not replace or rewrite those inputs.

## Start here

1. Read [`FORENSIC_INDEX.md`](FORENSIC_INDEX.md).
2. Read [`INVESTIGATION_STATUS.md`](INVESTIGATION_STATUS.md).
3. Read [`PROVENANCE.md`](PROVENANCE.md).
4. Use [`FILE_PURPOSE_MAP.md`](FILE_PURPOSE_MAP.md) to navigate source files.
5. Read [`BUILD_RECONSTRUCTION.md`](BUILD_RECONSTRUCTION.md) for the supported build model.
6. Consult [`EVIDENCE_MANIFEST.json`](evidence/EVIDENCE_MANIFEST.json) for hashes and machine-readable inventory.

The original APKs are preserved under [`artifacts/apk/`](artifacts/apk/). They must not be modified, re-signed, optimized, or overwritten.

## Release-readiness boundary

This repository is authoritative for its historical evidence, while the examination repository is derived. Publication is an owner-controlled action. Publication of the evidence or derived comparison repositories does not mean that the candidate error has been solved; runtime causality has not yet been established. No source difference should be treated as causal without appropriate runtime evidence.
