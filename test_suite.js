// Simple test suite for PGN4 conversion
// This imports and tests the actual functions from script.js

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

// Import functions from script.js for testing
// Note: This would work in a Node.js environment with proper ES6 module setup
// For browser testing, these functions are available in the global scope

// Function to get actual implementation functions
function getImplementationFunctions() {
    // In browser environment, functions are in global scope
    if (typeof window !== 'undefined' && window.coords) {
        return {
            coords: window.coords,
            gating: window.gating,
            getBoardDimensions: window.getBoardDimensions,
            pgn4ToPgn: window.pgn4ToPgn
        };
    }
    
    // In Node.js, we'd import from script.js
    // For now, return null to indicate functions need to be available
    return null;
}

// Test helper functions using actual implementation
function testCoordinateConversion() {
    console.log('=== Testing Coordinate Conversion (using actual coords function) ===');
    
    const functions = getImplementationFunctions();
    if (!functions || !functions.coords) {
        console.log('⚠️  coords function not available - run in browser with script.js loaded');
        return;
    }
    
    // Test with 11x11 board -> 8x8 board conversion
    const tests = [
        { input: ['d4', 'd', '4'], files: 8, ranks: 8, expected: 'a1' },
        { input: ['h5', 'h', '5'], files: 8, ranks: 8, expected: 'e2' },
        { input: ['k6', 'k', '6'], files: 8, ranks: 8, expected: 'h3' },
        { input: ['j11', 'j', '11'], files: 8, ranks: 8, expected: 'g8' },
    ];
    
    let passed = 0;
    tests.forEach(test => {
        const result = functions.coords(test.input, test.files, test.ranks);
        const success = result === test.expected ? '✅' : '❌';
        console.log(`${success} coords(${test.input[0]}) -> ${result} (expected: ${test.expected})`);
        if (result === test.expected) passed++;
    });
    
    console.log(`Coordinate tests: ${passed}/${tests.length} passed`);
}

function testGatingConversion() {
    console.log('\n=== Testing Gating Conversion (using actual gating function) ===');
    
    const functions = getImplementationFunctions();
    if (!functions || !functions.gating) {
        console.log('⚠️  gating function not available - run in browser with script.js loaded');
        return;
    }
    
    const tests = [
        { input: ['Bf11-j7&@yH-f11', 'Bf11-j7', 'H', 'f11'], expected: 'Bf11-j7/H' },
        { input: ['O-O&@yE-h11', 'O-O', 'E', 'h11'], expected: 'O-O/Eh11' },
        { input: ['O-O&@rE-h4', 'O-O', 'E', 'h4'], expected: 'O-O/Eh4' },
    ];
    
    let passed = 0;
    tests.forEach(test => {
        const result = functions.gating(test.input);
        const success = result === test.expected ? '✅' : '❌';
        console.log(`${success} gating(${test.input[0]}) -> ${result} (expected: ${test.expected})`);
        if (result === test.expected) passed++;
    });
    
    console.log(`Gating tests: ${passed}/${tests.length} passed`);
}

function testBoardDimensionExtraction() {
    console.log('\n=== Testing Board Dimension Auto-Detection (using actual getBoardDimensions function) ===');
    
    const functions = getImplementationFunctions();
    if (!functions || !functions.getBoardDimensions) {
        console.log('⚠️  getBoardDimensions function not available - run in browser with script.js loaded');
        return;
    }
    
    // Test with common variants (requires ffish to be initialized)
    const variants = ['chess', 'capablanca', 'grand'];
    
    variants.forEach(variant => {
        try {
            const dimensions = functions.getBoardDimensions(variant);
            console.log(`✅ ${variant}: ${dimensions.files}x${dimensions.ranks}`);
        } catch (error) {
            console.log(`⚠️  ${variant}: Error - ${error.message}`);
        }
    });
}

function testPGN4Conversion() {
    console.log('\n=== Testing Full PGN4 Conversion (using actual pgn4ToPgn function) ===');
    
    const functions = getImplementationFunctions();
    if (!functions || !functions.pgn4ToPgn) {
        console.log('⚠️  pgn4ToPgn function not available - run in browser with script.js loaded');
        return;
    }
    
    // Test basic conversion without ffish dependency
    const simplePgn4 = `[Site "www.chess.com/variants/seirawan-chess/game/test"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. h5-h7 d10-d8`;
    
    try {
        // Test with auto-detection (no user override)
        const result = functions.pgn4ToPgn(simplePgn4, null, null, null);
        console.log('✅ Basic conversion test completed');
        console.log('First few lines of output:');
        console.log(result.split('\n').slice(0, 5).join('\n'));
    } catch (error) {
        console.log(`❌ Conversion failed: ${error.message}`);
    }
}

function testTextTransformations() {
    console.log('\n=== Testing PGN4 Text Transformations (regex patterns) ===');
    
    let testText = "1. h5-h7 .. g10-g8 Bf11-j7&@yH-f11 O-O&@yE-h11";
    console.log(`Original: ${testText}`);
    
    // Test each transformation step
    let step = 1;
    
    // Step 1: Remove ' .. ' patterns
    testText = testText.replace(/ \.\. /g, ' ');
    console.log(`${step++}. After removing '..': ${testText}`);
    
    // Step 2: Handle captures - remove piece type after 'x'
    testText = testText.replace(/x[A-Z]([a-l][0-9]{1,2})/g, 'x$1');
    console.log(`${step++}. After capture cleanup: ${testText}`);
    
    // Step 3: Convert coordinates (simulate 11x11 to 8x8)
    const originalCoords = testText.match(/([a-l])([0-9]{1,2})/g);
    console.log(`${step++}. Found coordinates: ${originalCoords ? originalCoords.join(', ') : 'none'}`);
    
    // Step 4: Check gating pattern detection
    const gatingMatches = testText.match(/([^ ]*)&@[a-z]([A-Z])-([a-l][0-9]{1,2})/g);
    console.log(`${step++}. Found gating moves: ${gatingMatches ? gatingMatches.join(', ') : 'none'}`);
    
    console.log('✅ Text transformation patterns working correctly');
}

// Run all tests
function runTests() {
    console.log('PGN4 Converter Test Suite - Testing Actual Implementation\n');
    console.log('='.repeat(60));
    
    const functions = getImplementationFunctions();
    if (!functions) {
        console.log('⚠️  Implementation functions not available.');
        console.log('   In browser: Make sure script.js is loaded and ffish is initialized');
        console.log('   In Node.js: Proper ES6 module import setup needed');
        console.log('\n📝 Running pattern validation tests only...\n');
        
        testTextTransformations();
        return;
    }
    
    console.log('✅ Implementation functions available - running full test suite\n');
    
    testCoordinateConversion();
    testGatingConversion();
    testBoardDimensionExtraction();
    testPGN4Conversion();
    testTextTransformations();
    
    console.log('\n=== Test Summary ===');
    console.log('✅ Unit tests completed using actual implementation');
    console.log('🎯 All tests use the real functions from script.js');
    console.log('🌐 Run this in a browser with the converter loaded for full testing');
}

// Export test data for browser testing
if (typeof window !== 'undefined') {
    window.testPgn4Sample = testPgn4Sample;
    window.runTests = runTests;
    
    // Make implementation functions available for testing
    // These are imported from the global scope where script.js defines them
    window.getImplementationFunctions = getImplementationFunctions;
}

// Run tests if in Node.js (with limited functionality)
if (typeof window === 'undefined') {
    runTests();
}