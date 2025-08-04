# PGN4 to PGN Converter

A web-based converter that transforms PGN4 format files to standard PGN format using [ffishjs](https://www.npmjs.com/package/ffish-es6).

*Note: This repository is mostly AI generated. Be mindful of that, especially when relying on documentation.*

## 🚀 Recent Updates

- ✅ **Enhanced Coordinate Handling**: Supports non-standard board dimensions
- ✅ **Improved Gating Notation**: Correctly converts `&@yH-f11` patterns to `/H` format
- ✅ **Added Comprehensive Tests**: Unit tests and browser-based integration tests
- ✅ **CI/CD Pipeline**: Automated testing with GitHub Actions

## Features

- **Convert PGN4 to PGN**: Transforms coordinate notation (e.g., `g2-g4`) to algebraic notation (e.g., `e4`)
- **Multiple Input Methods**: File upload or direct text pasting
- **Multiple Output Methods**: Copy to clipboard or download as file
- **Chess Variant Support**: Auto-detects variants from Site header or manual override
- **Seirawan Chess**: Full support for gating moves and extended coordinates
- **Configurable Board Sizes**: Support for non-standard board dimensions
- **Professional UI**: Clean, responsive design with real-time status updates

## Live Demo

Visit the live application: [PGN4 Converter on Vercel](https://pgn4-converter.vercel.app)

## 🎯 Seirawan Chess Example

**Input (PGN4):**
```
[Site "www.chess.com/variants/seirawan-chess/game/62401310"]
[Variant "FFA"]
[RuleVariants "EnPassant Play4Mate PromoteTo=BEHNQR SeirawanSetup"]

1. h5-h7 .. g10-g8
2. h7xg8 .. Nj11-i9
4. Nj4-i6 .. Bf11-j7&@yH-f11
10. Bf4-i7&@rH-f4 .. O-O&@yE-h11
11. O-O&@rE-h4 .. Ni9-h7
```

**Output (PGN):**
```
[Variant "Seirawan"]
[Site "www.chess.com/variants/seirawan-chess/game/62401310"]

1. h5h7 g10g8
2. h7xg8 Nj11i9
4. Nj4i6 Bf11j7/H
10. Bf4i7/H O-O/Eh11
11. O-O/Eh4 Ni9h7
```

## Usage

1. **Input your PGN4 content** either by:
   - Uploading a PGN4 file
   - Pasting text directly into the textarea

2. **Configure options** (optional):
   - Override chess variant
   - Adjust board dimensions (files/ranks)

3. **Convert** by clicking the "Convert to PGN" button

4. **Get your result** by:
   - Copying to clipboard
   - Downloading as a .pgn file

## Development

### Prerequisites

- Node.js 18 or higher
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
   *Note: The postinstall script will automatically copy the required files from node_modules to lib/*
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

### Manual Setup (if needed)

If the automatic setup doesn't work, you can manually copy the required files:
```bash
npm run setup
```

This copies:
- `ffish.js` to `lib/ffish.js`
- `ffish.wasm` to the root directory

### Testing

Run the comprehensive test suite:
```bash
npm test
```

For browser-based testing:
1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/test.html`
3. Use the test interface to validate conversions

### CI/CD

The project includes a GitHub Actions CI pipeline that:
- ✅ Runs unit tests across Node.js 18.x and 20.x
- ✅ Validates JavaScript syntax
- ✅ Performs browser-based integration tests
- ✅ Checks for common linting issues

## Technical Details

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Chess Engine**: ffish-es6 (Fairy-Stockfish WebAssembly)
- **Testing**: Custom unit tests + Playwright for browser testing
- **Deployment**: Vercel static hosting
- **Browser Support**: Modern browsers with WebAssembly support

## Supported Formats

### Variants
- Standard Chess
- Seirawan Chess (with gating moves)
- And many more supported by Fairy-Stockfish

### Move Notations
- **Dash notation**: `h5-h7` → `h5h7`
- **Gating moves**: `Bf11-j7&@yH-f11` → `Bf11j7/H`
- **Castling with gating**: `O-O&@yE-h11` → `O-O/Eh11`
- **Extended coordinates**: Support for files beyond 'h' and ranks beyond 8

### Board Sizes
- Standard 8x8
- Extended boards up to 11x11 (with automatic padding detection)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `npm test` to ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details
