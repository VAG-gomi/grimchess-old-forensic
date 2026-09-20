# Build Reconstruction

## Verified inputs

The recovered project is a Capacitor Android application. The source archive contains a TypeScript/React mobile project, an Android Gradle project, Capacitor configuration, package lockfiles, and Stockfish JavaScript/WebAssembly assets. The APKs expose package and SDK metadata: the distinct older APKs report application IDs `com.grimware.chess` or `com.grimchess.offline2`, version code `1`, version name `1.0`, minimum SDK 22, target SDK 34, and compile SDK 34.

The recovered project contains `android/app/build.gradle`, `android/variables.gradle`, and Capacitor configuration. The source archive also contains Gradle wrapper material and package manifests.

## Reconstruction boundary

The evidence supports studying and potentially reconstructing the build, but it does not prove a single original build command, dependency lock state, signing configuration, or source commit for each APK. The APK signing certificates differ across the preserved objects. No original signing private key is included.

The `dist/` directory, Gradle build outputs, generated Android assets, dependency directories, and APK release copies inside the source archive are excluded from the source snapshot. They are generated or separately preserved artifacts, not assumed required source inputs.

No build is executed by creation of this archive. Any future build must be a separate, clearly labelled reconstruction and must not replace an original APK.
