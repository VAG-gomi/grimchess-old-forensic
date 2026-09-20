# Provenance

## APK evidence

Each APK under `artifacts/apk/` was copied byte-for-byte from an available local file. The originals were not modified. SHA-256 values were calculated before preservation and rechecked after copying. APK package, version, SDK, and signing values were extracted with Android build tools from the preserved copies.

## Source evidence

The recovered source comes from the available `Grimchess-Engine` source archive. Its Git history is preserved as text under [`evidence/source-archive/`](evidence/source-archive/). The source archive is evidence of recoverable project material. It is not proof of the exact source tree that produced every preserved APK.

## Classification

- `VERIFIED_FROM_APK`: directly measured or extracted from an APK.
- `VERIFIED_FROM_RECOVERED_SOURCE`: copied from the available old source archive.
- `RECONSTRUCTED`: derived documentation or a build model assembled from the evidence.
- `INFERRED`: interpretation that does not rise to a verified fact.
- `UNKNOWN`: not established by the available evidence.
