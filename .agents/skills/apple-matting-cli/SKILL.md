---
name: apple-matting-cli
description: Use when Codex needs to explain, verify, build, install, register, or troubleshoot this project's `apple-matting-cli` command-line and HTTP server interface for local macOS background removal. Applies to tasks involving CLI usage examples, `--server --port`, the `POST /matting` multipart API, PATH registration, release binary location, `-o/--output` arguments, build artifacts, and deciding whether a background service is needed.
---

# Apple Matting CLI

## Purpose

Use this skill to help users operate the project-local CLI wrapper around the existing Apple Vision/CoreImage matting pipeline. Normal CLI mode is a one-shot command: it starts, processes one image, writes a transparent PNG, prints the output path, and exits. Server mode is a long-running HTTP process for `POST /matting`.

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
apple-matting-cli --server --port 8080
apple-matting-cli --help
```

Behavior:

- With only `input.jpg`, write the default sibling output path from Rust `derive_output_path`, usually `input_nobg.png`.
- With positional `output.png`, `-o output.png`, or `--output output.png`, write to the specified output path.
- Print the written output path to stdout on success.
- Print errors to stderr and return a non-zero exit code on failure.
- Support only macOS for actual matting because the backend calls Swift Vision APIs.
- In server mode, listen on `0.0.0.0:<port>` and expose `POST /matting`.
- The HTTP endpoint accepts multipart form data with field name `file` and returns `image/png` on success.
- Server mode does not implement queueing, authentication, rate limiting, or a concurrency cap; recommend handling those in an outer layer for production.
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
Usage:
  apple-matting-cli <input-image> [-o|--output <output-png>]
  apple-matting-cli --server [--port <port>]
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

## HTTP Server Mode

Start the server:

```bash
apple-matting-cli --server --port 8080
```

Call the single-image matting endpoint:

```bash
curl -X POST -F "file=@input.jpg" http://127.0.0.1:8080/matting --output output.png
```

Expected behavior:

- Success: response body is the transparent PNG, with `Content-Type: image/png`.
- Missing `file` field: JSON error such as `{"error":"Missing multipart field file"}`.
- Matting failures: JSON error with HTTP `422`.

For server deployments, run the binary under `launchd`, a process manager, or a container-like supervisor. Use a reverse proxy or outer API layer for TLS, authentication, upload size limits, rate limits, queues, and concurrency control.

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

When the user asks whether the CLI must keep running in the background, answer no for one-shot CLI usage and yes for `--server` mode. Suggest an outer queue only for high-frequency calls, batch orchestration, progress tracking, cancellation support, or strict concurrency control.
