// Comprehensive test suite for PGN4 conversion
// This tests the conversion functions without requiring the full web interface

// Test data from the issue
const seirawanTestPgn4 = `[GameNr "62401310"]
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

// Simple test for regular chess
const standardTestPgn4 = `[Event "Test Game"]
[Site "https://www.pychess.org/variants/chess"]
[Date "2023.12.25"]
[White "Player1"]
[Black "Player2"]

1. e2e4 e7e5 2. g1f3 b8c6 3. f1b5`;

// Copy helper functions from script.js for testing
const SEIRAWAN_CASTLING = {
    'O-O': 'O-O',
    'O-O-O': 'O-O-O',
    'h1-e1': 'O-O',
    'h8-e8': 'O-O',
    'a1-e1': 'O-O-O',
    'a8-e8': 'O-O-O'
};

function coords(match, files, ranks) {
    const file = match[1];
    const rank = match[2];
    const newFile = String.fromCharCode(file.charCodeAt(0) - (11 - files));
    const newRank = parseInt(rank) - (11 - ranks);
    return newFile + newRank;
}

function extractBoardDimensions(startFen4) {
    if (!startFen4) return { files: 8, ranks: 8 };
    
    // Extract FEN part (after the last '-')
    const fenParts = startFen4.split('-');
    const fenPart = fenParts[fenParts.length - 1];
    
    // Count ranks and files
    const ranks = fenPart.split('/');
    const numRanks = ranks.length;
    
    let numFiles = 8;
    if (ranks.length > 0) {
        // Count files in first rank (split by comma)
        const files = ranks[0].split(',');
        numFiles = files.length;
    }
    
    // For Seirawan chess specifically, the board appears to be larger in the FEN
    // but the actual game coordinates suggest a smaller playable area
    // Based on analysis: coordinates go up to k (11th file) and rank 11
    if (numFiles > 11 || numRanks > 11) {
        // Likely a padded board, use the coordinate analysis
        return { files: 11, ranks: 11 };
    }
    
    return { files: numFiles, ranks: numRanks };
}

function gating(match) {
    const move = match[1];
    const gatePieceColor = match[2]; // y or r 
    const gatePiece = match[3]; // H, E, etc.
    const square = match[4];
    
    if (SEIRAWAN_CASTLING[move]) {
        return SEIRAWAN_CASTLING[move] + '/' + gatePiece + square;
    } else {
        return move + '/' + gatePiece;
    }
}

// Test helper functions
function testCoordinateConversion() {
    console.log('=== Testing Coordinate Conversion ===');
    
    // Test with 11x11 board (Seirawan)
    const tests = [
        { input: ['d4', 'd', '4'], files: 11, ranks: 11, expected: 'a1' },
        { input: ['h5', 'h', '5'], files: 11, ranks: 11, expected: 'e2' },
        { input: ['k6', 'k', '6'], files: 11, ranks: 11, expected: 'h3' },
        { input: ['j11', 'j', '11'], files: 11, ranks: 11, expected: 'g8' },
    ];
    
    tests.forEach(test => {
        const result = coords(test.input, test.files, test.ranks);
        console.log(`coords(${test.input[0]}) -> ${result} (expected: ${test.expected})`);
    });
}

function testGatingConversion() {
    console.log('\n=== Testing Gating Conversion ===');
    
    const tests = [
        { input: ['Bf11-j7&@yH-f11', 'Bf11-j7', 'y', 'H', 'f11'], expected: 'Bf11-j7/H' },
        { input: ['O-O&@yE-h11', 'O-O', 'y', 'E', 'h11'], expected: 'O-O/Eh11' },
        { input: ['O-O&@rE-h4', 'O-O', 'r', 'E', 'h4'], expected: 'O-O/Eh4' },
    ];
    
    tests.forEach(test => {
        const result = gating(test.input);
        console.log(`gating(${test.input[0]}) -> ${result} (expected: ${test.expected})`);
    });
}

function testBoardDimensionExtraction() {
    console.log('\n=== Testing Board Dimension Extraction ===');
    
    const startFen4 = "R-0,1,0,1-1,1,1,1-1,1,1,1-0,0,0,0-0-{'seirawanDrops':(('d4','e4','f4','g4','h4','i4','j4','k4'),(),('d11','e11','f11','g11','h11','i11','j11','k11'),(),()),'pawnBaseRank':5,'wb':true,'dim':'8x8','bank':('rE,rH','','yE,yH','')}-x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,yR,yN,yB,yQ,yK,yB,yN,yR,x,x,x/x,x,x,yP,yP,yP,yP,yP,yP,yP,yP,x,x,x/x,x,x,8,x,x,x/x,x,x,8,x,x,x/x,x,x,8,x,x,x/x,x,x,8,x,x,x/x,x,x,rP,rP,rP,rP,rP,rP,rP,rP,x,x,x/x,x,x,rR,rN,rB,rQ,rK,rB,rN,rR,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x";
    
    const dimensions = extractBoardDimensions(startFen4);
    console.log(`Extracted dimensions: ${dimensions.files}x${dimensions.ranks}`);
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
    
    // Remove ' .. ' patterns
    testText = testText.replace(/ \.\. /g, ' ');
    console.log(`After removing '..': ${testText}`);
    
    // Convert dash notation to UCI format
    testText = testText.replace(/([a-l][0-9]{1,2})-([a-l][0-9]{1,2})/g, '$1$2');
    console.log(`After dash conversion: ${testText}`);
    
    // Handle gating moves
    testText = testText.replace(/([^ ]*)&@([a-z])([A-Z])-([a-l][0-9]{1,2})/g, (match, move, gatePieceColor, gatePiece, square) => {
        return gating([match, move, gatePieceColor, gatePiece, square]);
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
    window.seirawanTestPgn4 = seirawanTestPgn4;
    window.standardTestPgn4 = standardTestPgn4;
    window.runTests = runTests;
}

// Run tests if in Node.js
if (typeof window === 'undefined') {
    runTests();
}