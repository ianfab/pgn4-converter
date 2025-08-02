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
    
    // Direct translation from Python: chr(ord(file) - (11 - files)) + str(int(rank) - (11 - ranks))
    const newFile = String.fromCharCode(file.charCodeAt(0) - (11 - files));
    const newRank = parseInt(rank) - (11 - ranks);
    
    return newFile + newRank;
}


// Gating move conversion - equivalent to Python gating()
function gating(match) {
    const move = match[1];
    const gatePiece = match[2]; // The piece letter (H, E, etc.)
    const square = match[3];    // The square (f11, h11, etc.)
    
    if (SEIRAWAN_CASTLING[move]) {
        return SEIRAWAN_CASTLING[move] + '/' + gatePiece + square;
    } else {
        return move + '/' + gatePiece;
    }
}

// Main conversion function - equivalent to Python pgn4_to_pgn()
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
    
    // Convert coordinates using the coords function (matches Python exactly)
    pgn4 = pgn4.replace(/([a-l])([0-9]{1,2})/g, (match, file, rank) => {
        return coords([match, file, rank], files, ranks);
    });
    
    // Handle gating moves - matches Python regex exactly
    pgn4 = pgn4.replace(/([^ ]*)&@[a-z]([A-Z])-([a-l][0-9]{1,2})/g, (match, move, gatePiece, square) => {
        return gating([match, move, gatePiece, square]);
    });

    let pgn = '';
    let variant = overrideVariant;
    let startFen = null;
    
    if (overrideVariant) {
        startFen = ffish.startingFen(overrideVariant);
    }
    
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
                            throw new Error(`Unsupported variant: ${variant}`);
                        }
                        startFen = ffish.startingFen(variant);
                    }
                }
                
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