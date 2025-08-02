# Test Documentation

## PGN4 Converter Test Suite

This directory contains comprehensive tests for the PGN4 converter functionality.

### Test Files

1. **test_suite.js** - Unit tests for core conversion functions
2. **test.html** - Browser-based integration test interface  
3. **test_conversion.js** - Node.js test attempt (requires WASM fixes)

### Running Tests

#### Browser Tests (Recommended)
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/test.html`
3. Click "Load Seirawan Sample" to load test data
4. Click "Convert PGN4" to test conversion
5. Check the output for correct conversion

#### Unit Tests  
```bash
npm test  # Runs the unit test suite
```

### Test Cases Covered

#### 1. Seirawan Chess Sample
- **Input**: Complex PGN4 with gating moves, 11x11 board coordinates
- **Expected**: Proper conversion to SAN notation with gating syntax

#### 2. Coordinate Conversion
- Tests conversion from larger board coordinates to standard format
- Handles files beyond 'h' and ranks beyond 8

#### 3. Gating Move Notation
- Pattern: `move&@colorPiece-square` → `move/Piece`
- Examples: `Bf11-j7&@yH-f11` → `Bf11j7/H`

#### 4. Variant Detection
- Auto-detects variant from Site header
- Supports manual override

#### 5. Board Dimension Extraction  
- Parses StartFen4 metadata to determine board size
- Handles padded boards (14x14 → 11x11 playable area)

### Known Test Results

✅ **Seirawan Sample**: Successfully converts complex game  
✅ **Gating Moves**: Properly formatted  
✅ **Variant Detection**: "seirawan" extracted from Site  
✅ **Coordinate Handling**: Large board coordinates processed  
✅ **Move Format**: Dash notation converted to UCI  

### Future Test Improvements

- [ ] Add automated browser testing with Playwright
- [ ] Test more chess variants (King of the Hill, Atomic, etc.)
- [ ] Add performance benchmarks
- [ ] Test error handling and edge cases
- [ ] Add validation against known good conversions