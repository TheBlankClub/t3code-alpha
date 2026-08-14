import CoreGraphics
import Foundation
import ImageIO

private let canvasSize = 1024
private let bodyInset = 100
private let bodySize = 824

private func fail(_ message: String) -> Never {
  FileHandle.standardError.write(Data("\(message)\n".utf8))
  exit(1)
}

private func loadImage(at path: String) -> CGImage {
  let url = URL(fileURLWithPath: path) as CFURL
  guard
    let source = CGImageSourceCreateWithURL(url, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    fail("Could not read PNG: \(path)")
  }
  return image
}

private func render(_ image: CGImage, in rect: CGRect) -> [UInt8] {
  var pixels = [UInt8](repeating: 0, count: canvasSize * canvasSize * 4)
  guard
    let context = CGContext(
      data: &pixels,
      width: canvasSize,
      height: canvasSize,
      bitsPerComponent: 8,
      bytesPerRow: canvasSize * 4,
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
  else {
    fail("Could not create the icon rendering context.")
  }

  context.interpolationQuality = .high
  context.draw(image, in: rect)
  return pixels
}

guard CommandLine.arguments.count == 4 else {
  fail(
    "Usage: swift scripts/render-alpha-macos-icon.swift <alpha-universal.png> <native-macos-template.png> <output.png>"
  )
}

let sourcePath = CommandLine.arguments[1]
let templatePath = CommandLine.arguments[2]
let outputPath = CommandLine.arguments[3]
let source = loadImage(at: sourcePath)
let template = loadImage(at: templatePath)

guard source.width == canvasSize, source.height == canvasSize else {
  fail("Alpha source must be 1024x1024: \(sourcePath)")
}
guard template.width == canvasSize, template.height == canvasSize else {
  fail("Native macOS template must be 1024x1024: \(templatePath)")
}

let scaledSource = render(
  source,
  in: CGRect(x: bodyInset, y: bodyInset, width: bodySize, height: bodySize)
)
let nativeTemplate = render(
  template,
  in: CGRect(x: 0, y: 0, width: canvasSize, height: canvasSize)
)
var output = [UInt8](repeating: 0, count: canvasSize * canvasSize * 4)

for pixelIndex in 0..<(canvasSize * canvasSize) {
  let offset = pixelIndex * 4
  let alphaByte = nativeTemplate[offset + 3]
  let alpha = Double(alphaByte) / 255

  // The checked-in native Development export provides Apple's legacy body and
  // shadow alpha. Fade the Alpha artwork into that neutral shadow envelope.
  let bodyCoverage = max(0, min(1, (Double(alphaByte) - 72) / 183))
  output[offset] = UInt8(Double(scaledSource[offset]) * bodyCoverage * alpha)
  output[offset + 1] = UInt8(Double(scaledSource[offset + 1]) * bodyCoverage * alpha)
  output[offset + 2] = UInt8(Double(scaledSource[offset + 2]) * bodyCoverage * alpha)
  output[offset + 3] = alphaByte
}

guard
  let context = CGContext(
    data: &output,
    width: canvasSize,
    height: canvasSize,
    bitsPerComponent: 8,
    bytesPerRow: canvasSize * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ),
  let image = context.makeImage(),
  let destination = CGImageDestinationCreateWithURL(
    URL(fileURLWithPath: outputPath) as CFURL,
    "public.png" as CFString,
    1,
    nil
  )
else {
  fail("Could not create Alpha macOS PNG: \(outputPath)")
}

CGImageDestinationAddImage(destination, image, nil)
guard CGImageDestinationFinalize(destination) else {
  fail("Could not write Alpha macOS PNG: \(outputPath)")
}
