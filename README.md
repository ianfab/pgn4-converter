# PGN4 to PGN Converter

A web-based converter that transforms PGN4 format files to standard PGN format using Fairy-Stockfish WebAssembly.

## Features

- **Convert PGN4 to PGN**: Transforms coordinate notation (e.g., `e2e4`) to algebraic notation (e.g., `e4`)
- **Multiple Input Methods**: File upload or direct text pasting
- **Multiple Output Methods**: Copy to clipboard or download as file
- **Chess Variant Support**: Auto-detects variants from Site header or manual override
- **Configurable Board Sizes**: Support for non-standard board dimensions
- **Professional UI**: Clean, responsive design with real-time status updates

## Live Demo

Visit the live application: [PGN4 Converter on Vercel](https://pgn4-converter.vercel.app)

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

## Example Conversion

**Input (PGN4):**
```
[Event "Test Game"]
[Site "https://www.pychess.org/variants/chess"]
[Date "2023.12.25"]
[White "Player1"]
[Black "Player2"]

1. e2e4 e7e5 2. g1f3 b8c6 3. f1b5
```

**Output (PGN):**
```
[Event "Test Game"]
[Variant "Chess"]
[Site "https://www.pychess.org/variants/chess"]
[Date "2023.12.25"]
[White "Player1"]
[Black "Player2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5
```

## Development

### Prerequisites

- Node.js 14 or higher
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

### Deployment

The project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on every push to main branch

## Technical Details

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Chess Engine**: ffish-es6 (Fairy-Stockfish WebAssembly)
- **Deployment**: Vercel static hosting
- **Browser Support**: Modern browsers with WebAssembly support

## License

MIT License - see LICENSE file for details