// Georgia Font Base64 encoded for PDF generation
// Import the Base64-encoded font files here
// The Base64 strings should be very long (hundreds of thousands of characters)

// For pdfmake, we need Base64 strings for:
// - normal (Regular)
// - bold
// - italics (optional, can use normal)
// - bolditalics (optional, can use bold)

// IMPORTANT: Replace the empty strings below with your actual Base64-encoded font data
// You can convert .ttf files to Base64 using: https://www.base64encode.org/
// or use a Node.js script to read and encode the font files

// Example structure (replace with actual Base64 strings):
export const georgiaNormal = "" // Base64 string for Georgia Regular
export const georgiaBold = "" // Base64 string for Georgia Bold
export const georgiaItalic = "" // Base64 string for Georgia Italic (optional, can use georgiaNormal)
export const georgiaBoldItalic = "" // Base64 string for Georgia Bold Italic (optional, can use georgiaBold)

// If you only have normal and bold, you can use:
// export const georgiaItalic = georgiaNormal
// export const georgiaBoldItalic = georgiaBold
