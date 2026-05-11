---
name: apple-matting-cli
description: Use when Codex needs to explain, verify, build, install, register, or troubleshoot this project's `apple-matting-cli` command-line interface for local macOS background removal. Applies to tasks involving CLI usage examples, PATH registration, release binary location, `-o/--output` arguments, build artifacts, and deciding whether a background service is needed.
---

# Apple Matting CLI

## Purpose

Use this skill to help users operate the project-local CLI wrapper around the existing Apple Vision/CoreImage matting pipeline. The CLI is a one-shot command: it starts, processes one image, writes a transparent PNG, prints the output path, and exits. It does not require a long-running background process.

## Current CLI Contract

The release binary is expected at:

```bash
/Users/choco/my-project/apple-matting/src-tauri/target/release/apple-matting-cli
```

Supported forms:

```bash
apple-matting-cli input.jpg
apple-matting-cli input.jpg output.png
apple-matting-cli input.jpg -o output.png
apple-matting-cli input.jpg --output output.png
apple-matting-cli --help
```

Behavior:

- With only `input.jpg`, write the default sibling output path from Rust `derive_output_path`, usually `input_nobg.png`.
- With positional `output.png`, `-o output.png`, or `--output output.png`, write to the specified output path.
- Print the written output path to stdout on success.
- Print errors to stderr and return a non-zero exit code on failure.
- Support only macOS for actual matting because the backend calls Swift Vision APIs.
- Do not claim batch support yet; note it as a future extension using `--batch` or input/output directories.

## Build Or Verify

From the project root:

```bash
cd /Users/choco/my-project/apple-matting/src-tauri
cargo test
cargo build --release --bin apple-matting-cli
./target/release/apple-matting-cli --help
```

Expected help output:

```text
Usage: apple-matting-cli <input-image> [-o|--output <output-png>]
```

If `cargo build --release` fails with Swift/Clang module cache permission errors, rerun with the required sandbox escalation. The build script compiles `src-tauri/swift/MattingBridge.swift` and may need to write to the user-level Clang module cache.

## Register In PATH

On this machine, prefer `/usr/local/bin` because it is already in PATH and is writable by the current user:

```bash
ln -s /Users/choco/my-project/apple-matting/src-tauri/target/release/apple-matting-cli /usr/local/bin/apple-matting-cli
```

Current local registration:

```text
/usr/local/bin/apple-matting-cli -> /Users/choco/my-project/apple-matting/src-tauri/target/release/apple-matting-cli
```

If `/usr/local/bin/apple-matting-cli` already exists, inspect it first with:

```bash
ls -l /usr/local/bin/apple-matting-cli
```

Do not overwrite or remove an existing command without user approval.

Use a user-local symlink when the user does not want to write to `/usr/local/bin`:

```bash
mkdir -p ~/.local/bin
ln -s /Users/choco/my-project/apple-matting/src-tauri/target/release/apple-matting-cli ~/.local/bin/apple-matting-cli
```

Ensure the shell has:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

For zsh, place that line in `~/.zshrc`, then run:

```bash
source ~/.zshrc
```

Alternative system-wide location:

```bash
sudo ln -s /Users/choco/my-project/apple-matting/src-tauri/target/release/apple-matting-cli /usr/local/bin/apple-matting-cli
```

Validate registration:

```bash
command -v apple-matting-cli
apple-matting-cli --help
```

## Build Artifacts Guidance

Explain artifact size clearly:

- End users only need the final binary, `target/release/apple-matting-cli`.
- The rest of `src-tauri/target/` is build cache and intermediate files.
- Deleting `target/` is safe for source control hygiene, but the next build will be slow because Rust/Tauri/Swift dependencies must compile again.
- Do not commit `target/`; it should remain ignored.

## Troubleshooting

Use these checks before changing code:

```bash
cd /Users/choco/my-project/apple-matting/src-tauri
./target/release/apple-matting-cli --help
file ./target/release/apple-matting-cli
ls -lh ./target/release/apple-matting-cli
```

For runtime failures:

- `Unsupported platform`: expected outside macOS.
- `No foreground found in image`: Vision did not detect a foreground instance.
- `Could not write output PNG`: check output directory existence and permissions.
- `Image could not be loaded`: check input path, file existence, and supported image format.

When the user asks whether the CLI must keep running in the background, answer no for single-image usage. Suggest a daemon, HTTP API, or queue only for high-frequency calls, batch orchestration, progress tracking, or cancellation support.
