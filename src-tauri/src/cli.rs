use crate::matting::perform_matting;

const USAGE: &str = "Usage: apple-matting-cli <input-image> [-o|--output <output-png>]";

#[derive(Debug, PartialEq, Eq)]
pub enum CliArgs {
    Help,
    Run {
        input_path: String,
        output_path: Option<String>,
    },
}

pub fn parse_args(args: &[String]) -> Result<CliArgs, String> {
    match args {
        [_bin, flag] if flag == "-h" || flag == "--help" => Ok(CliArgs::Help),
        [_bin, input_path] => Ok(CliArgs::Run {
            input_path: input_path.clone(),
            output_path: None,
        }),
        [_bin, input_path, output_path] => Ok(CliArgs::Run {
            input_path: input_path.clone(),
            output_path: Some(output_path.clone()),
        }),
        [_bin, input_path, output_flag, output_path] if output_flag == "-o" || output_flag == "--output" => {
            Ok(CliArgs::Run {
                input_path: input_path.clone(),
                output_path: Some(output_path.clone()),
            })
        }
        _ => Err(USAGE.to_string()),
    }
}

pub fn run(args: Vec<String>) -> i32 {
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
        Err(message) => {
            eprintln!("{message}");
            2
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_args, CliArgs};

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

        assert_eq!(
            parse_args(&args),
            Err("Usage: apple-matting-cli <input-image> [-o|--output <output-png>]".to_string())
        );
    }
}
