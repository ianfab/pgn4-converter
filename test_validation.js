#!/usr/bin/env node

// Simple validation test for PGN4 converter functions
// This validates the core logic without requiring browser or ffish engine

console.log('🧪 Running PGN4 Converter Unit Tests...\n');

// Test data
const seirawanPgn4Sample = `[Site "www.chess.com/variants/seirawan-chess/game/62401310"]
1. h5-h7 .. g10-g8
4. Nj4-i6 .. Bf11-j7&@yH-f11
10. Bf4-i7&@rH-f4 .. O-O&@yE-h11`;

// Copy helper functions for testing
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
    
    const fileDiff = files - 8;
    const rankDiff = ranks - 8;
    
    const fileOffset = Math.floor(fileDiff / 2);
    const rankOffset = Math.floor(rankDiff / 2);
    
    const newFile = String.fromCharCode(file.charCodeAt(0) - fileOffset);
    const newRank = parseInt(rank) - rankOffset;
    
    return newFile + newRank;
}

function extractBoardDimensions(startFen4) {
    if (!startFen4) return { files: 8, ranks: 8 };
    
    const fenParts = startFen4.split('-');
    const fenPart = fenParts[fenParts.length - 1];
    
    const ranks = fenPart.split('/');
    const numRanks = ranks.length;
    
    let numFiles = 8;
    if (ranks.length > 0) {
        const files = ranks[0].split(',');
        numFiles = files.length;
    }
    
    if (numFiles > 11 || numRanks > 11) {
        return { files: 11, ranks: 11 };
    }
    
    return { files: numFiles, ranks: numRanks };
}

function gating(match) {
    const move = match[1];
    const gatePieceColor = match[2];
    const gatePiece = match[3];
    const square = match[4];
    
    if (SEIRAWAN_CASTLING[move]) {
        return SEIRAWAN_CASTLING[move] + '/' + gatePiece + square;
    } else {
        return move + '/' + gatePiece;
    }
}

// Test functions
function testVariantDetection() {
    console.log('Testing variant detection...');
    
    const siteHeaders = [
        'www.chess.com/variants/seirawan-chess/game/62401310',
        'https://www.pychess.org/variants/chess',
        'playstrategy.org/variants/atomic',
    ];
    
    const expected = ['seirawan', 'chess', 'atomic'];
    let passed = 0;
    
    siteHeaders.forEach((site, i) => {
        const variantMatch = site.match(/variants\/([^/\]"]*)/);
        if (variantMatch) {
            let variant = variantMatch[1].replace("-chess", "").replace(/-/g, '');
            if (variant === expected[i]) {
                console.log(`  ✅ ${site} → ${variant}`);
                passed++;
            } else {
                console.log(`  ❌ ${site} → ${variant} (expected ${expected[i]})`);
            }
        }
    });
    
    return passed === expected.length;
}

function testDashConversion() {
    console.log('Testing dash-to-UCI conversion...');
    
    const testCases = [
        { input: 'h5-h7', expected: 'h5h7' },
        { input: 'g10-g8', expected: 'g10g8' },
        { input: 'Nj4-i6', expected: 'Nj4i6' },
        { input: 'e2e4', expected: 'e2e4' } // already UCI
    ];
    
    let passed = 0;
    
    testCases.forEach(test => {
        const result = test.input.replace(/([a-l][0-9]{1,2})-([a-l][0-9]{1,2})/g, '$1$2');
        if (result === test.expected) {
            console.log(`  ✅ ${test.input} → ${result}`);
            passed++;
        } else {
            console.log(`  ❌ ${test.input} → ${result} (expected ${test.expected})`);
        }
    });
    
    return passed === testCases.length;
}

function testGatingConversion() {
    console.log('Testing gating move conversion...');
    
    const testCases = [
        { input: ['Bf11-j7&@yH-f11', 'Bf11-j7', 'y', 'H', 'f11'], expected: 'Bf11-j7/H' },
        { input: ['O-O&@yE-h11', 'O-O', 'y', 'E', 'h11'], expected: 'O-O/Eh11' },
        { input: ['Bf4-i7&@rH-f4', 'Bf4-i7', 'r', 'H', 'f4'], expected: 'Bf4-i7/H' },
    ];
    
    let passed = 0;
    
    testCases.forEach(test => {
        const result = gating(test.input);
        if (result === test.expected) {
            console.log(`  ✅ ${test.input[0]} → ${result}`);
            passed++;
        } else {
            console.log(`  ❌ ${test.input[0]} → ${result} (expected ${test.expected})`);
        }
    });
    
    return passed === testCases.length;
}

function testTextTransformations() {
    console.log('Testing PGN4 text transformations...');
    
    let testText = "1. h5-h7 .. g10-g8 Bf11-j7&@yH-f11 O-O&@yE-h11";
    
    // Remove ' .. ' patterns
    testText = testText.replace(/ \.\. /g, ' ');
    const step1 = !testText.includes(' .. ');
    
    // Convert dash notation
    testText = testText.replace(/([a-l][0-9]{1,2})-([a-l][0-9]{1,2})/g, '$1$2');
    const step2 = testText.includes('h5h7') && testText.includes('g10g8');
    
    // Handle gating moves
    testText = testText.replace(/([^ ]*)&@([a-z])([A-Z])-([a-l][0-9]{1,2})/g, (match, move, gatePieceColor, gatePiece, square) => {
        return gating([match, move, gatePieceColor, gatePiece, square]);
    });
    const step3 = testText.includes('Bf11j7/H') && testText.includes('O-O/Eh11');
    
    if (step1) console.log('  ✅ Removed .. patterns');
    else console.log('  ❌ Failed to remove .. patterns');
    
    if (step2) console.log('  ✅ Converted dash notation');
    else console.log('  ❌ Failed to convert dash notation');
    
    if (step3) console.log('  ✅ Converted gating moves');
    else console.log('  ❌ Failed to convert gating moves');
    
    return step1 && step2 && step3;
}

function testBoardDimensionExtraction() {
    console.log('Testing board dimension extraction...');
    
    const startFen4 = "x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,x,x,x,x,x,x,x,x,x,x,x/x,x,x,yR,yN,yB,yQ,yK,yB,yN,yR,x,x,x";
    const dimensions = extractBoardDimensions(startFen4);
    
    const success = dimensions.files === 11 && dimensions.ranks === 11;
    if (success) {
        console.log(`  ✅ Extracted dimensions: ${dimensions.files}x${dimensions.ranks}`);
    } else {
        console.log(`  ❌ Wrong dimensions: ${dimensions.files}x${dimensions.ranks} (expected 11x11)`);
    }
    
    return success;
}

// Run all tests
console.log('Running comprehensive unit tests...\n');

const results = [
    testVariantDetection(),
    testDashConversion(),
    testGatingConversion(),
    testTextTransformations(),
    testBoardDimensionExtraction()
];

const totalTests = results.length;
const passedTests = results.filter(r => r).length;

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('🎉 All unit tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}