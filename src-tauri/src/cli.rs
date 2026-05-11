use std::net::SocketAddr;
use std::path::Path;

use axum::extract::Multipart;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Json, Router};
use serde::Serialize;

use crate::matting::perform_matting;

const DEFAULT_SERVER_PORT: u16 = 8080;
const USAGE: &str = "Usage:
  apple-matting-cli <input-image> [-o|--output <output-png>]
  apple-matting-cli --server [--port <port>]";

#[derive(Debug, PartialEq, Eq)]
pub enum CliArgs {
    Help,
    Run {
        input_path: String,
        output_path: Option<String>,
    },
    Server {
        port: u16,
    },
}

pub fn parse_args(args: &[String]) -> Result<CliArgs, String> {
    if args.len() == 2 && matches!(args[1].as_str(), "-h" | "--help") {
        return Ok(CliArgs::Help);
    }

    if args.iter().skip(1).any(|arg| arg == "--server") {
        return parse_server_args(args);
    }

    match args {
        [_bin, input_path] => Ok(CliArgs::Run {
            input_path: input_path.clone(),
            output_path: None,
        }),
        [_bin, input_path, output_path] => Ok(CliArgs::Run {
            input_path: input_path.clone(),
            output_path: Some(output_path.clone()),
        }),
        [_bin, input_path, output_flag, output_path]
            if output_flag == "-o" || output_flag == "--output" =>
        {
            Ok(CliArgs::Run {
                input_path: input_path.clone(),
                output_path: Some(output_path.clone()),
            })
        }
        _ => Err(USAGE.to_string()),
    }
}

fn parse_server_args(args: &[String]) -> Result<CliArgs, String> {
    let mut port = DEFAULT_SERVER_PORT;
    let mut index = 1;

    while index < args.len() {
        match args[index].as_str() {
            "--server" => {
                index += 1;
            }
            "-p" | "--port" => {
                let value = args.get(index + 1).ok_or_else(|| USAGE.to_string())?;
                port = value
                    .parse::<u16>()
                    .map_err(|_| format!("Invalid port: {value}"))?;
                index += 2;
            }
            _ => return Err(USAGE.to_string()),
        }
    }

    Ok(CliArgs::Server { port })
}

pub async fn run(args: Vec<String>) -> i32 {
    match parse_args(&args) {
        Ok(CliArgs::Help) => {
            println!("{USAGE}");
            0
        }
        Ok(CliArgs::Run {
            input_path,
            output_path,
        }) => match perform_matting(&input_path, output_path.as_deref()) {
            Ok(path) => {
                println!("{path}");
                0
            }
            Err(error) => {
                eprintln!("{error}");
                1
            }
        },
        Ok(CliArgs::Server { port }) => match run_server(port).await {
            Ok(()) => 0,
            Err(error) => {
                eprintln!("{error}");
                1
            }
        },
        Err(message) => {
            eprintln!("{message}");
            2
        }
    }
}

async fn run_server(port: u16) -> Result<(), String> {
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let app = Router::new().route("/matting", post(handle_matting));
    let listener = tokio::net::TcpListener::bind(address)
        .await
        .map_err(|error| format!("Could not bind server to {address}: {error}"))?;

    eprintln!("apple-matting-cli server listening on http://{address}");
    eprintln!("POST multipart/form-data to /matting with field name `file`");

    axum::serve(listener, app)
        .await
        .map_err(|error| format!("Server error: {error}"))
}

async fn handle_matting(mut multipart: Multipart) -> Result<Response, ApiError> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(ApiError::bad_request)?
    {
        if field.name() != Some("file") {
            continue;
        }

        let extension = input_extension(field.file_name());
        let bytes = field.bytes().await.map_err(ApiError::bad_request)?;
        let temp_dir = tempfile::tempdir().map_err(ApiError::internal)?;
        let input_path = temp_dir.path().join(format!("input.{extension}"));
        let output_path = temp_dir.path().join("output.png");

        tokio::fs::write(&input_path, bytes)
            .await
            .map_err(ApiError::internal)?;

        let input_string = input_path.to_string_lossy().to_string();
        let output_string = output_path.to_string_lossy().to_string();

        let matting_result = tokio::task::spawn_blocking(move || {
            perform_matting(&input_string, Some(&output_string))
        })
        .await
        .map_err(ApiError::internal)?;

        matting_result.map_err(ApiError::matting)?;

        let output_bytes = tokio::fs::read(&output_path)
            .await
            .map_err(ApiError::internal)?;

        return Ok(([(header::CONTENT_TYPE, "image/png")], output_bytes).into_response());
    }

    Err(ApiError::new(
        StatusCode::BAD_REQUEST,
        "Missing multipart field `file`",
    ))
}

fn input_extension(file_name: Option<&str>) -> &'static str {
    let Some(file_name) = file_name else {
        return "jpg";
    };

    match Path::new(file_name)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_ascii_lowercase())
        .as_deref()
    {
        Some("png") => "png",
        Some("webp") => "webp",
        Some("bmp") => "bmp",
        _ => "jpg",
    }
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    message: String,
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

impl ApiError {
    fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }

    fn bad_request(error: impl std::fmt::Display) -> Self {
        Self::new(StatusCode::BAD_REQUEST, error.to_string())
    }

    fn internal(error: impl std::fmt::Display) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, error.to_string())
    }

    fn matting(error: impl std::fmt::Display) -> Self {
        Self::new(StatusCode::UNPROCESSABLE_ENTITY, error.to_string())
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ErrorBody {
                error: self.message,
            }),
        )
            .into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_args, CliArgs, DEFAULT_SERVER_PORT, USAGE};

    #[test]
    fn parses_input_only() {
        let args = vec!["apple-matting-cli".to_string(), "input.jpg".to_string()];

        assert_eq!(
            parse_args(&args),
            Ok(CliArgs::Run {
                input_path: "input.jpg".to_string(),
                output_path: None,
            })
        );
    }

    #[test]
    fn parses_input_and_output() {
        let args = vec![
            "apple-matting-cli".to_string(),
            "input.jpg".to_string(),
            "output.png".to_string(),
        ];

        assert_eq!(
            parse_args(&args),
            Ok(CliArgs::Run {
                input_path: "input.jpg".to_string(),
                output_path: Some("output.png".to_string()),
            })
        );
    }

    #[test]
    fn parses_short_output_flag() {
        let args = vec![
            "apple-matting-cli".to_string(),
            "input.jpg".to_string(),
            "-o".to_string(),
            "output.png".to_string(),
        ];

        assert_eq!(
            parse_args(&args),
            Ok(CliArgs::Run {
                input_path: "input.jpg".to_string(),
                output_path: Some("output.png".to_string()),
            })
        );
    }

    #[test]
    fn parses_long_output_flag() {
        let args = vec![
            "apple-matting-cli".to_string(),
            "input.jpg".to_string(),
            "--output".to_string(),
            "output.png".to_string(),
        ];

        assert_eq!(
            parse_args(&args),
            Ok(CliArgs::Run {
                input_path: "input.jpg".to_string(),
                output_path: Some("output.png".to_string()),
            })
        );
    }

    #[test]
    fn parses_server_with_default_port() {
        let args = vec!["apple-matting-cli".to_string(), "--server".to_string()];

        assert_eq!(
            parse_args(&args),
            Ok(CliArgs::Server {
                port: DEFAULT_SERVER_PORT,
            })
        );
    }

    #[test]
    fn parses_server_with_port() {
        let args = vec![
            "apple-matting-cli".to_string(),
            "--server".to_string(),
            "--port".to_string(),
            "9090".to_string(),
        ];

        assert_eq!(parse_args(&args), Ok(CliArgs::Server { port: 9090 }));
    }

    #[test]
    fn parses_server_with_short_port() {
        let args = vec![
            "apple-matting-cli".to_string(),
            "--server".to_string(),
            "-p".to_string(),
            "9090".to_string(),
        ];

        assert_eq!(parse_args(&args), Ok(CliArgs::Server { port: 9090 }));
    }

    #[test]
    fn parses_help() {
        let args = vec!["apple-matting-cli".to_string(), "--help".to_string()];

        assert_eq!(parse_args(&args), Ok(CliArgs::Help));
    }

    #[test]
    fn rejects_invalid_argument_count() {
        let args = vec![
            "apple-matting-cli".to_string(),
            "input.jpg".to_string(),
            "output.png".to_string(),
            "extra".to_string(),
        ];

        assert_eq!(parse_args(&args), Err(USAGE.to_string()));
    }

    #[test]
    fn rejects_invalid_server_port() {
        let args = vec![
            "apple-matting-cli".to_string(),
            "--server".to_string(),
            "--port".to_string(),
            "not-a-port".to_string(),
        ];

        assert_eq!(
            parse_args(&args),
            Err("Invalid port: not-a-port".to_string())
        );
    }
}
