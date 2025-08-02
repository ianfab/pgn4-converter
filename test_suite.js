// Comprehensive test suite for PGN4 conversion
// This tests the conversion functions without requiring the full web interface

// Test data from the issue - Seirawan chess sample
const testPgn4Sample = `[GameNr "62401310"]
[TimeControl "5+2"]
[Variant "FFA"]
[RuleVariants "EnPassant Play4Mate PromoteTo=BEHNQR SeirawanSetup"]
[StartFen4 "R-0,1,0,1-1,1,1,1-1,1,1,1-0,0,0,0-0-{'seirawanDrops':(('d4','e4','f4','g4','h4','i4','j4','k4'),(),('d11','e11','f11','g11','h11','i11','j11','k11'),(),()),'pawnBaseRank':5,'wb':true,'dim':'8x8','bank':('rE,rH','','yE,yH','')}-x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,yR,yN,yB,yQ,yK,yB,yN,yR,x,x,x/x,x,x,yP,yP,yP,yP,yP,yP,yP,yP,x,x,x/x,x,x,8,x,x,x/x,x,x,8,x,x,x/x,x,x,8,x,x,x/x,x,x,8,x,x,x/x,x,x,rP,rP,rP,rP,rP,rP,rP,rP,x,x,x/x,x,x,rR,rN,rB,rQ,rK,rB,rN,rR,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x"]
[White "ubdip"]
[WhiteElo "1894"]
[Black "GMYAZ"]
[BlackElo "2173"]
[Result "1/2-1/2"]
[Termination "Threefold repetition"]
[Site "www.chess.com/variants/seirawan-chess/game/62401310"]
[Date "Sat Feb 24 2024 20:41:21 GMT+0000 (Coordinated Universal Time)"]
[CurrentMove "35"]

1. h5-h7 .. g10-g8
2. h7xg8 .. Nj11-i9
3. g5-g7 .. Ni9xg8
4. Nj4-i6 .. Bf11-j7&@yH-f11
5. Bi4-h5 .. h10-h9
6. k5-k6 .. Bj7-i8
7. d5-d6 .. Bi11-h10
8. f5-f7 .. Ng8-i9
9. Ne4-f6 .. Ne11-g10
10. Bf4-i7&@rH-f4 .. O-O&@yE-h11
11. O-O&@rE-h4 .. Ni9-h7
12. Bh5-g6 .. Nh7xNf6
13. e5xNf6 .. Bi8-j9
14. d6-d7 .. Bh10-g9
15. Bi7-j8 .. Bg9-h10
16. Bj8-i7 .. Bh10-g9
17. Bi7-j8 .. Bg9-h10
18. Bj8-i7`;

// Copy helper functions from script.js for testing - these match the Python reference implementation
const SEIRAWAN_CASTLING = {
    'O-O': 'O-O',
    'O-O-O': 'O-O-O',
    'h1-e1': 'O-O',
    'h8-e8': 'O-O',
    'a1-e1': 'O-O-O',
    'a8-e8': 'O-O-O'
};

// Coordinate conversion function - equivalent to Python coords()
function coords(match, files, ranks) {
    const file = match[1];
    const rank = match[2];
    // Direct translation from Python: chr(ord(file) - (11 - files)) + str(int(rank) - (11 - ranks))
    const newFile = String.fromCharCode(file.charCodeAt(0) - (11 - files));
    const newRank = parseInt(rank) - (11 - ranks);
    return newFile + newRank;
}

// Gating move conversion - equivalent to Python gating()
function gating(match) {
    const move = match[1];
    const gatePiece = match[2]; // The piece letter (H, E, etc)
    const square = match[3];    // The square (f11, h11, etc)
    
    if (SEIRAWAN_CASTLING[move]) {
        return SEIRAWAN_CASTLING[move] + '/' + gatePiece + square;
    } else {
        return move + '/' + gatePiece;
    }
}

// Test helper functions
function testCoordinateConversion() {
    console.log('=== Testing Coordinate Conversion ===');
    
    // Test with 11x11 board -> 8x8 board conversion
    // Python formula: chr(ord(file) - (11 - files)) + str(int(rank) - (11 - ranks))
    // For 11x11 -> 8x8: chr(ord(file) - 3) + str(int(rank) - 3)
    const tests = [
        { input: ['d4', 'd', '4'], files: 8, ranks: 8, expected: 'a1' }, // d(100) - 3 = a(97), 4 - 3 = 1
        { input: ['h5', 'h', '5'], files: 8, ranks: 8, expected: 'e2' }, // h(104) - 3 = e(101), 5 - 3 = 2
        { input: ['k6', 'k', '6'], files: 8, ranks: 8, expected: 'h3' }, // k(107) - 3 = h(104), 6 - 3 = 3
        { input: ['j11', 'j', '11'], files: 8, ranks: 8, expected: 'g8' }, // j(106) - 3 = g(103), 11 - 3 = 8
    ];
    
    tests.forEach(test => {
        const result = coords(test.input, test.files, test.ranks);
        console.log(`coords(${test.input[0]}) -> ${result} (expected: ${test.expected})`);
    });
}

function testGatingConversion() {
    console.log('\n=== Testing Gating Conversion ===');
    
    const tests = [
        { input: ['Bf11-j7&@yH-f11', 'Bf11-j7', 'H', 'f11'], expected: 'Bf11-j7/H' },
        { input: ['O-O&@yE-h11', 'O-O', 'E', 'h11'], expected: 'O-O/Eh11' },
        { input: ['O-O&@rE-h4', 'O-O', 'E', 'h4'], expected: 'O-O/Eh4' },
    ];
    
    tests.forEach(test => {
        const result = gating(test.input);
        console.log(`gating(${test.input[0]}) -> ${result} (expected: ${test.expected})`);
    });
}

function testBoardDimensionExtraction() {
    console.log('\n=== Testing Board Dimension Extraction ===');
    
    // No longer needed - we use fixed parameters from command line like Python version
    console.log('Board dimensions are now passed as parameters (--files, --ranks) like Python version');
}

function testVariantExtraction() {
    console.log('\n=== Testing Variant Extraction ===');
    
    const siteHeaders = [
        'www.chess.com/variants/seirawan-chess/game/62401310',
        'https://www.pychess.org/variants/chess',
        'playstrategy.org/variants/atomic',
    ];
    
    siteHeaders.forEach(site => {
        const variantMatch = site.match(/variants\/([^/\]"]*)/);
        if (variantMatch) {
            let variant = variantMatch[1].replace("-chess", "").replace(/-/g, '');
            console.log(`Site: ${site} -> Variant: ${variant}`);
        }
    });
}

function testPGN4Transformations() {
    console.log('\n=== Testing PGN4 Text Transformations ===');
    
    let testText = "1. h5-h7 .. g10-g8 Bf11-j7&@yH-f11 O-O&@yE-h11";
    console.log(`Original: ${testText}`);
    
    // Step 1: Remove ' .. ' patterns
    testText = testText.replace(/ \.\. /g, ' ');
    console.log(`After removing '..': ${testText}`);
    
    // Step 2: Handle captures - remove piece type after 'x'
    testText = testText.replace(/x[A-Z]([a-l][0-9]{1,2})/g, 'x$1');
    console.log(`After capture cleanup: ${testText}`);
    
    // Step 3: Convert coordinates (11x11 board to 8x8)
    testText = testText.replace(/([a-l])([0-9]{1,2})/g, (match, file, rank) => {
        return coords([match, file, rank], 8, 8);
    });
    console.log(`After coordinate conversion: ${testText}`);
    
    // Step 4: Handle gating moves - updated regex to match Python exactly
    testText = testText.replace(/([^ ]*)&@[a-z]([A-Z])-([a-l][0-9]{1,2})/g, (match, move, gatePiece, square) => {
        return gating([match, move, gatePiece, square]);
    });
    console.log(`After gating conversion: ${testText}`);
}

function testDashToUCIConversion() {
    console.log('\n=== Testing Dash to UCI Conversion ===');
    
    const testMoves = [
        'h5-h7',
        'g10-g8', 
        'Nj4-i6',
        'Bf11-j7',
        'e2e4' // already UCI
    ];
    
    testMoves.forEach(move => {
        const converted = move.replace(/([a-l][0-9]{1,2})-([a-l][0-9]{1,2})/g, '$1$2');
        console.log(`${move} -> ${converted}`);
    });
}

// Run all tests
function runTests() {
    console.log('PGN4 Converter Test Suite\n');
    console.log('='.repeat(50));
    
    testCoordinateConversion();
    testGatingConversion();
    testBoardDimensionExtraction();
    testVariantExtraction();
    testPGN4Transformations();
    testDashToUCIConversion();
    
    console.log('\n=== Test Summary ===');
    console.log('All unit tests completed. Manual verification required for move processing.');
    console.log('Next step: Test full conversion with a web browser interface.');
}

// Export test data for browser testing
if (typeof window !== 'undefined') {
    window.testPgn4Sample = testPgn4Sample;
    window.runTests = runTests;
}

// Run tests if in Node.js
if (typeof window === 'undefined') {
    runTests();
}