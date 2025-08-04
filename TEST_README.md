# Test Documentation

## PGN4 Converter Test Suite

This directory contains tests for the PGN4 converter functionality that validate the actual implementation.

### Test Philosophy

The test suite has been redesigned to **test the actual implementation** rather than duplicate logic:
- ✅ Tests real functions from `script.js`
- ✅ No code duplication between tests and implementation
- ✅ Stays in sync automatically with code changes
- ✅ Validates actual behavior, not theoretical behavior

### Test Files

1. **test_suite.js** - Unit tests that import and test actual functions from script.js
2. **test.html** - Browser-based integration test interface  

### Running Tests

#### Browser Tests (Recommended)
1. Open `index.html` in a browser (or start dev server if available)
2. Open browser console
3. Run: `runTests()` to execute the full test suite
4. Or test conversion manually using the web interface

#### Alternative: Load test.html
1. Open `test.html` in browser
2. Click "Load Sample" to load test data
3. Click "Convert PGN4" to test conversion
4. Or click "Run Unit Tests" for unit test execution
5. Check console for test results

#### Node.js Tests (Limited)
```bash
node test_suite.js  # Runs basic pattern validation only
```
*Note: Full tests require browser environment due to ffish WASM dependency*

### Test Cases Validated

#### 1. Coordinate Conversion (`coords` function)
- **Tests**: Conversion from 11x11 board coordinates to 8x8 standard format
- **Examples**: `d4` → `a1`, `j11` → `g8`
- **Validation**: Uses actual `coords()` function from script.js

#### 2. Gating Move Conversion (`gating` function)  
- **Tests**: Seirawan chess gating notation
- **Pattern**: `move&@colorPiece-square` → `move/Piece` or `castling/Piecesquare`
- **Examples**: 
  - `Bf11-j7&@yH-f11` → `Bf11-j7/H`
  - `O-O&@yE-h11` → `O-O/Eh11`
- **Validation**: Uses actual `gating()` function from script.js

#### 3. Board Dimension Auto-Detection (`getBoardDimensions` function)
- **Tests**: FEN parsing to extract board dimensions
- **Variants**: chess (8x8), capablanca (10x8), grand (10x10)
- **Validation**: Uses actual `getBoardDimensions()` function from script.js

#### 4. Full PGN4 Conversion (`pgn4ToPgn` function)
- **Tests**: Complete conversion pipeline
- **Input**: Real PGN4 with Seirawan chess sample
- **Features**: Variant detection, coordinate conversion, move processing
- **Validation**: Uses actual `pgn4ToPgn()` function from script.js

#### 5. Text Pattern Validation
- **Tests**: Regex patterns for PGN4 processing
- **Patterns**: `..` removal, capture cleanup, coordinate detection, gating detection
- **Independence**: Works even without ffish initialization

### Expected Test Results

When running `runTests()` in browser console:

```
✅ coords(d4) -> a1 (expected: a1)
✅ coords(h5) -> e2 (expected: e2)  
✅ coords(k6) -> h3 (expected: h3)
✅ coords(j11) -> g8 (expected: g8)
Coordinate tests: 4/4 passed

✅ gating(Bf11-j7&@yH-f11) -> Bf11-j7/H (expected: Bf11-j7/H)
✅ gating(O-O&@yE-h11) -> O-O/Eh11 (expected: O-O/Eh11)
✅ gating(O-O&@rE-h4) -> O-O/Eh4 (expected: O-O/Eh4)
Gating tests: 3/3 passed

✅ chess: 8x8
✅ capablanca: 10x8  
✅ grand: 10x10

✅ Basic conversion test completed
```

### Test Architecture Benefits

- **No Code Duplication**: Tests import actual functions instead of copying them
- **Always Current**: Tests automatically stay in sync with implementation changes
- **Real Validation**: Tests actual behavior, not duplicated theoretical behavior
- **Maintainable**: Single source of truth for each function
- **Comprehensive**: Tests cover all major conversion functions

### Future Test Improvements

- [ ] Add automated browser testing with Playwright/Puppeteer
- [ ] Test more chess variants (King of the Hill, Atomic, etc.)
- [ ] Add performance benchmarks for large PGN4 files
- [ ] Test error handling and edge cases  
- [ ] Add validation against known good conversion outputs
- [ ] Create CI pipeline for automated testing