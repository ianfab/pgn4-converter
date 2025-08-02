import Module from './node_modules/ffish-es6/ffish.js';

let ffish = null;
let isInitialized = false;

// Seirawan castling mapping - same as in Python
const SEIRAWAN_CASTLING = {
    'O-O': 'O-O',
    'O-O-O': 'O-O-O',
    'h1-e1': 'O-O',
    'h8-e8': 'O-O',
    'a1-e1': 'O-O-O',
    'a8-e8': 'O-O-O'
};

// Initialize ffish
new Module().then(loadedModule => {
    ffish = loadedModule;
    isInitialized = true;
    console.log('FFish initialized successfully');
    
    // Populate variant dropdown
    populateVariantDropdown();
    
    // Update status
    updateStatus('FFish engine loaded successfully. Ready to convert PGN4 files.');
    
    // Enable the convert button
    document.getElementById('convert-btn').disabled = false;
}).catch(error => {
    console.error('Failed to initialize FFish:', error);
    showError('Failed to initialize chess engine. Please refresh the page.');
});

// Coordinate conversion function - equivalent to Python coords()
function coords(match, files, ranks) {
    const file = match[1];
    const rank = match[2];
    
    // Convert from larger board coordinates to 8x8 coordinates
    // This assumes the larger board has padding around an 8x8 core
    const fileDiff = files - 8;
    const rankDiff = ranks - 8;
    
    // Calculate the offset (assuming symmetric padding)
    const fileOffset = Math.floor(fileDiff / 2);
    const rankOffset = Math.floor(rankDiff / 2);
    
    const newFile = String.fromCharCode(file.charCodeAt(0) - fileOffset);
    const newRank = parseInt(rank) - rankOffset;
    
    return newFile + newRank;
}

// Extract board dimensions from StartFen4
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

// Gating move conversion - equivalent to Python gating()
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

// Main conversion function - equivalent to Python pgn4_to_pgn()
function pgn4ToPgn(pgn4Text, overrideVariant, files, ranks) {
    if (!isInitialized) {
        throw new Error('Chess engine not initialized');
    }

    // Clean up PGN4 text - equivalent to Python regex substitutions
    let pgn4 = pgn4Text;
    
    // Remove ' .. ' patterns
    pgn4 = pgn4.replace(/ \.\. /g, ' ');
    
    // Handle captures - remove piece type after 'x'
    pgn4 = pgn4.replace(/x[A-Z]([a-l][0-9]{1,2})/g, 'x$1');
    
    // Extract board dimensions from StartFen4 if present
    let boardDimensions = { files, ranks };
    const startFenMatch = pgn4.match(/\[StartFen4 "([^"]+)"\]/);
    if (startFenMatch) {
        boardDimensions = extractBoardDimensions(startFenMatch[1]);
        console.log('Detected board dimensions:', boardDimensions);
    }
    
    // Apply coordinate transformation for non-standard board sizes
    if (boardDimensions.files !== 8 || boardDimensions.ranks !== 8) {
        // Convert coordinates using the coords function
        pgn4 = pgn4.replace(/([a-l])([0-9]{1,2})/g, (match, file, rank) => {
            return coords([match, file, rank], boardDimensions.files, boardDimensions.ranks);
        });
    }
    
    // Handle gating moves - updated pattern to capture the gate piece color
    pgn4 = pgn4.replace(/([^ ]*)&@([a-z])([A-Z])-([a-l][0-9]{1,2})/g, (match, move, gatePieceColor, gatePiece, square) => {
        return gating([match, move, gatePieceColor, gatePiece, square]);
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

// Process a line containing moves
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
        
        // Convert dash notation to UCI format (e.g., h5-h7 -> h5h7)
        move = move.replace(/([a-l][0-9]{1,2})-([a-l][0-9]{1,2})/g, '$1$2');
        
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



function populateVariantDropdown() {
    if (!isInitialized) return;
    
    const select = document.getElementById('variant-select');
    const variants = ffish.variants().split(' ');
    
    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Add variant options
    variants.forEach(variant => {
        const option = document.createElement('option');
        option.value = variant;
        option.textContent = variant.charAt(0).toUpperCase() + variant.slice(1);
        select.appendChild(option);
    });
}

function updateStatus(message) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // Hide error if showing status
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide status if showing error
    const statusDiv = document.getElementById('status');
    statusDiv.style.display = 'none';
}

function clearMessages() {
    document.getElementById('status').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const pasteInput = document.getElementById('paste-input');
    const convertBtn = document.getElementById('convert-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const output = document.getElementById('output');
    
    // Disable convert button initially
    convertBtn.disabled = true;
    
    // File input handler
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                pasteInput.value = e.target.result;
                clearMessages();
            };
            reader.readAsText(file);
        }
    });
    
    // Convert button handler
    convertBtn.addEventListener('click', function() {
        const pgn4Text = pasteInput.value.trim();
        if (!pgn4Text) {
            showError('Please provide PGN4 input either by uploading a file or pasting text.');
            return;
        }
        
        const overrideVariant = document.getElementById('variant-select').value || null;
        const files = parseInt(document.getElementById('files-input').value) || 8;
        const ranks = parseInt(document.getElementById('ranks-input').value) || 8;
        
        try {
            updateStatus('Converting PGN4 to PGN...');
            convertBtn.disabled = true;
            
            // Use setTimeout to allow UI to update
            setTimeout(() => {
                try {
                    const result = pgn4ToPgn(pgn4Text, overrideVariant, files, ranks);
                    output.value = result;
                    updateStatus('Conversion completed successfully!');
                    
                    // Enable output controls
                    copyBtn.disabled = false;
                    downloadBtn.disabled = false;
                } catch (error) {
                    console.error('Conversion error:', error);
                    showError(`Conversion failed: ${error.message}`);
                } finally {
                    convertBtn.disabled = false;
                }
            }, 100);
            
        } catch (error) {
            console.error('Conversion error:', error);
            showError(`Conversion failed: ${error.message}`);
            convertBtn.disabled = false;
        }
    });
    
    // Copy to clipboard handler
    copyBtn.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(output.value);
            updateStatus('PGN copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            showError('Failed to copy to clipboard. Please select and copy manually.');
        }
    });
    
    // Download file handler
    downloadBtn.addEventListener('click', function() {
        const content = output.value;
        if (!content) {
            showError('No content to download.');
            return;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.pgn';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateStatus('PGN file downloaded!');
    });
    
    // Initially disable output controls
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
});