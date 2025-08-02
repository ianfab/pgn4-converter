// Test script to validate PGN4 conversion
import Module from './node_modules/ffish-es6/ffish.js';

// Sample PGN4 from the issue
const testPgn4 = `[GameNr "62401310"]
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

let ffish = null;

async function initializeFfish() {
    try {
        ffish = await new Module();
        console.log('FFish initialized successfully');
        console.log('Available variants:', ffish.variants());
        return true;
    } catch (error) {
        console.error('Failed to initialize FFish:', error);
        return false;
    }
}

// Copy the conversion functions from script.js for testing
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

function gating(match) {
    const move = match[1];
    const gatePiece = match[2];
    const square = match[3];
    
    if (SEIRAWAN_CASTLING[move]) {
        return SEIRAWAN_CASTLING[move] + '/' + gatePiece + square;
    } else {
        return move + '/' + gatePiece;
    }
}

function processMoveLine(line, variant, startFen) {
    const parts = line.split(/\s+/);
    const processedParts = [];
    const moves = [];
    
    for (let i = 0; i < parts.length; i++) {
        let move = parts[i].trim();
        
        if (!move) continue;
        
        // Skip move numbers, timestamps, and game end markers
        if (/^\d+\./.test(move) || move === 'T' || move === 'R' || move === 'S' || move === '*' || 
            move === '1-0' || move === '0-1' || move === '1/2-1/2') {
            processedParts.push(move);
            continue;
        }
        
        // Clean weird game end markers
        move = move.replace(/S$/, '').replace(/\+#/, '#');
        
        if (!move) continue;
        
        try {
            // Create a board with current position
            const board = new ffish.Board(variant, startFen);
            
            // Apply all previous moves
            for (const prevMove of moves) {
                board.push(prevMove);
            }
            
            // Get legal moves in UCI format
            const legalMovesUci = board.legalMoves().split(' ').filter(m => m);
            
            // First try as UCI move (most likely for PGN4 format)
            if (legalMovesUci.includes(move)) {
                moves.push(move);
                const sanMove = board.sanMove(move);
                processedParts.push(sanMove);
                board.delete();
                continue;
            }
            
            // Then try to push the move as SAN notation
            try {
                board.pushSan(move);
                const moveStack = board.moveStack().split(' ');
                const uciMove = moveStack[moveStack.length - 1];
                moves.push(uciMove);
                processedParts.push(move);
                board.delete();
                continue;
            } catch (e) {
                // If that fails, try LAN notation
            }
            
            // Try to match as LAN notation
            let found = false;
            for (const uciMove of legalMovesUci) {
                try {
                    const lanMove = board.sanMove(uciMove, 0); // 0 = LAN notation
                    if (lanMove === move) {
                        moves.push(uciMove);
                        const sanMove = board.sanMove(uciMove);
                        processedParts.push(sanMove);
                        found = true;
                        break;
                    }
                } catch (e) {
                    // Skip if we can't get LAN notation
                }
            }
            
            if (!found) {
                console.warn(`Warning: Move ${move} not found or invalid`);
                processedParts.push(move);
            }
            
            board.delete();
        } catch (error) {
            console.warn(`Error processing move ${move}:`, error);
            processedParts.push(move);
        }
    }
    
    return processedParts.join(' ');
}

function pgn4ToPgn(pgn4Text, overrideVariant, files, ranks) {
    if (!ffish) {
        throw new Error('Chess engine not initialized');
    }

    // Clean up PGN4 text
    let pgn4 = pgn4Text;
    
    // Remove ' .. ' patterns
    pgn4 = pgn4.replace(/ \.\. /g, ' ');
    
    // Handle captures - remove piece type after 'x'
    pgn4 = pgn4.replace(/x[A-Z]([a-l][0-9]{1,2})/g, 'x$1');
    
    // Only apply coordinate transformation for non-standard board sizes
    if (files !== 8 || ranks !== 8) {
        // Convert coordinates using the coords function
        pgn4 = pgn4.replace(/([a-l])([0-9]{1,2})/g, (match, file, rank) => {
            return coords([match, file, rank], files, ranks);
        });
    }
    
    // Handle gating moves
    pgn4 = pgn4.replace(/([^ ]*)&@[a-z]([A-Z])-([a-l][0-9]{1,2})/g, (match, move, gatePiece, square) => {
        return gating([match, move, gatePiece, square]);
    });

    let pgn = '';
    let variant = overrideVariant || 'chess'; // Default to chess
    let startFen = null;
    
    const lines = pgn4.split(/\r?\n/);
    
    for (const line of lines) {
        if (line.startsWith('[')) {
            if (line.startsWith('[Variant')) {
                continue; // Skip original variant header
            }
            
            if (line.startsWith('[Site')) {
                if (!overrideVariant) {
                    // Extract variant from Site header
                    const variantMatch = line.match(/variants\/([^/\]"]*)/);
                    if (variantMatch) {
                        variant = variantMatch[1].replace("-chess", "").replace(/-/g, '');
                        const availableVariants = ffish.variants().split(' ');
                        if (!availableVariants.includes(variant)) {
                            console.warn(`Unsupported variant: ${variant}, defaulting to chess`);
                            variant = 'chess';
                        }
                    }
                }
                
                // Set start FEN for the variant
                startFen = ffish.startingFen(variant);
                
                // Add variant header
                pgn += `[Variant "${variant.charAt(0).toUpperCase() + variant.slice(1)}"]\n`;
                pgn += line + '\n';
            } else {
                pgn += line + '\n';
            }
        } else if (line.trim()) {
            // Process move line
            const processedLine = processMoveLine(line, variant, startFen);
            pgn += processedLine + '\n';
        } else {
            pgn += line + '\n';
        }
    }
    
    return pgn;
}

async function testConversion() {
    console.log('Testing PGN4 conversion...\n');
    
    if (!(await initializeFfish())) {
        return;
    }
    
    try {
        console.log('Input PGN4:');
        console.log(testPgn4);
        console.log('\n' + '='.repeat(50) + '\n');
        
        const result = pgn4ToPgn(testPgn4, null, 8, 8);
        
        console.log('Converted PGN:');
        console.log(result);
        
    } catch (error) {
        console.error('Conversion failed:', error);
    }
}

// Run the test
testConversion();