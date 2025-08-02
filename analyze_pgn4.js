// Analysis script to understand PGN4 conversion issues
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

console.log('=== PGN4 Analysis ===\n');

// Extract StartFen4 and analyze board structure
const startFenMatch = testPgn4.match(/\[StartFen4 "([^"]+)"\]/);
if (startFenMatch) {
    const startFen4 = startFenMatch[1];
    console.log('StartFen4 found:');
    console.log(startFen4.substring(0, 100) + '...\n');
    
    // Extract the FEN part (after the last '-')
    const fenParts = startFen4.split('-');
    const fenPart = fenParts[fenParts.length - 1];
    console.log('FEN part:');
    console.log(fenPart.substring(0, 200) + '...\n');
    
    // Count files and ranks
    const ranks = fenPart.split('/');
    console.log('Number of ranks:', ranks.length);
    if (ranks.length > 0) {
        const files = ranks[0].split(',').length;
        console.log('Number of files in first rank:', files);
    }
    
    // Extract dimension info from JSON part if present
    const jsonMatch = startFen4.match(/{[^}]+}/);
    if (jsonMatch) {
        console.log('JSON metadata:', jsonMatch[0]);
        try {
            const metadata = JSON.parse(jsonMatch[0].replace(/'/g, '"'));
            console.log('Parsed metadata:');
            console.log('- dim:', metadata.dim);
            console.log('- pawnBaseRank:', metadata.pawnBaseRank);
            console.log('- wb:', metadata.wb);
        } catch (e) {
            console.log('Could not parse JSON metadata');
        }
    }
}

console.log('\n=== Move Analysis ===\n');

// Extract moves and analyze coordinates
const moveLines = testPgn4.split('\n').filter(line => /^\d+\./.test(line.trim()));
const allMoves = [];

moveLines.forEach(line => {
    console.log('Move line:', line);
    // Extract moves (remove move numbers and '..')
    const moves = line.replace(/^\d+\.\s*/, '').split(/\s+\.\.\s+|\s+/);
    moves.forEach(move => {
        if (move && move !== '..' && !/^\d+\.$/.test(move)) {
            allMoves.push(move.trim());
        }
    });
});

console.log('\nExtracted moves:');
allMoves.forEach((move, i) => {
    console.log(`${i + 1}: ${move}`);
});

console.log('\n=== Coordinate Analysis ===\n');

// Analyze coordinates in moves
const coordinatePattern = /([a-l])(\d{1,2})/g;
const coordinates = new Set();

allMoves.forEach(move => {
    let match;
    while ((match = coordinatePattern.exec(move)) !== null) {
        coordinates.add(match[0]);
    }
});

const coordArray = Array.from(coordinates).sort();
console.log('All coordinates found:', coordArray);

// Find max file and rank
let maxFile = 'a';
let maxRank = 1;

coordArray.forEach(coord => {
    const file = coord[0];
    const rank = parseInt(coord.substring(1));
    if (file > maxFile) maxFile = file;
    if (rank > maxRank) maxRank = rank;
});

console.log('Max file:', maxFile, '(position:', maxFile.charCodeAt(0) - 'a'.charCodeAt(0) + 1, ')');
console.log('Max rank:', maxRank);

console.log('\n=== Gating Move Analysis ===\n');

// Analyze gating moves
const gatingMoves = allMoves.filter(move => move.includes('&@'));
console.log('Gating moves found:');
gatingMoves.forEach(move => {
    console.log(`- ${move}`);
    const gatingMatch = move.match(/([^&]*)&@([a-z])([A-Z])-([a-l]\d{1,2})/);
    if (gatingMatch) {
        console.log(`  Base move: ${gatingMatch[1]}`);
        console.log(`  Gate piece color: ${gatingMatch[2]}`);
        console.log(`  Gate piece type: ${gatingMatch[3]}`);
        console.log(`  Gate square: ${gatingMatch[4]}`);
    }
});

console.log('\n=== Site Header Analysis ===\n');

// Extract variant from Site
const siteMatch = testPgn4.match(/\[Site "([^"]+)"\]/);
if (siteMatch) {
    const site = siteMatch[1];
    console.log('Site:', site);
    const variantMatch = site.match(/variants\/([^/\]"]*)/);
    if (variantMatch) {
        let variant = variantMatch[1].replace("-chess", "").replace(/-/g, '');
        console.log('Extracted variant:', variant);
    }
}