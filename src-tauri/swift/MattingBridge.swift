import Foundation
import Vision
import CoreImage
import CoreGraphics

// MARK: - Single Image Matting
//
// Exported via @_cdecl so Rust `extern "C"` can call it directly.
//
// Parameters:
//   inputPath  – absolute file path to the source image (UTF-8, null-terminated)
//   outputPath – absolute file path where the result PNG will be written
//
// Returns:
//   0  -> success
//  -1  -> could not load input image
//  -2  -> Vision request failed
//  -3  -> no foreground instance found
//  -4  -> mask generation failed
//  -5  -> blend filter produced no output
//  -6  -> failed to write output PNG
//  -99 -> macOS version too old (requires 12.0+)

@available(macOS 14.0, *)
@_cdecl("matting_process_image")
public func mattingProcessImage(
    inputPath: UnsafePointer<CChar>,
    outputPath: UnsafePointer<CChar>
) -> Int32 {
    guard #available(macOS 14.0, *) else { return -99 }

    let input  = String(cString: inputPath)
    let output = String(cString: outputPath)

    // Build a file URL from the raw path string
    let inputURL: URL
    if input.hasPrefix("file://") {
        guard let u = URL(string: input) else { return -1 }
        inputURL = u
    } else {
        inputURL = URL(fileURLWithPath: input)
    }

    guard let ciImage = CIImage(contentsOf: inputURL) else { return -1 }

    // --- Vision: foreground instance mask ---
    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])

    do {
        try handler.perform([request])
    } catch {
        return -2
    }

    guard let result = request.results?.first else { return -3 }

    let maskBuffer: CVPixelBuffer
    do {
        maskBuffer = try result.generateScaledMaskForImage(
            forInstances: result.allInstances,
            from: handler
        )
    } catch {
        return -4
    }

    // --- CIFilter: blend foreground over transparent background ---
    let maskImage = CIImage(cvPixelBuffer: maskBuffer)

    guard let blendFilter = CIFilter(name: "CIBlendWithMask") else { return -5 }
    blendFilter.setValue(ciImage,          forKey: kCIInputImageKey)
    blendFilter.setValue(maskImage,        forKey: kCIInputMaskImageKey)
    blendFilter.setValue(CIImage.empty(),  forKey: kCIInputBackgroundImageKey)

    guard let outputImage = blendFilter.outputImage else { return -5 }

    // --- Write RGBA PNG ---
    let context = CIContext(options: [.workingColorSpace: CGColorSpaceCreateDeviceRGB()])
    let outputURL = URL(fileURLWithPath: output)

    do {
        try context.writePNGRepresentation(
            of: outputImage,
            to: outputURL,
            format: .RGBA8,
            colorSpace: CGColorSpaceCreateDeviceRGB()
        )
    } catch {
        return -6
    }

    return 0
}
