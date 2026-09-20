# Investigation Journey

The investigation began with multiple locally available GrimChess APKs and a recoverable source archive. The APK files were fingerprinted without modification. Four distinct SHA-256 values were found among the older-build candidates, so they were assigned stable evidence IDs and preserved separately.

The APK metadata showed two package identities: `com.grimware.chess` for three APKs and `com.grimchess.offline2` for one APK. All reported version code 1, version name 1.0, minimum SDK 22, and target/compile SDK 34. The signer certificates differed, so the files remain separate evidence objects.

The source archive was inspected as a recoverable project. Its meaningful TypeScript, Android Gradle, Capacitor, lockfile, and Stockfish assets were preserved. Generated `dist/`, build/intermediate outputs, dependencies, and nested Git internals were excluded. The exclusion is documented rather than silently applied.

The current checkpoint is an evidence base, not a conclusion about historical build identity. Future work may reconstruct the old build or compare versions in a separate repository. Such work must preserve these APKs as immutable inputs and keep comparison results outside this archive.
