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
    console.log('FFish module loaded successfully');
    
    // Test basic functionality first
    console.log('Available ffish methods:', Object.getOwnPropertyNames(ffish).filter(name => typeof ffish[name] === 'function'));
    console.log('Available ffish properties:', Object.getOwnPropertyNames(ffish));
    console.log('ffish.Notation:', ffish.Notation);

    // Initialize with a test board to ensure full functionality
    try {
        const testBoard = new ffish.Board('chess');
        console.log('Test board created, testing notation conversion...');
        const testMove = 'e2e4';
        const sanMove = testBoard.sanMove(testMove);
        console.log(`UCI ${testMove} converts to SAN: ${sanMove}`);
        testBoard.delete();
    } catch (error) {
        console.error('Error creating test board:', error);
    }
    
    isInitialized = true;

    // Populate variant dropdown
    populateVariantDropdown();
    
    // Initialize dimension placeholders
    updateDimensionPlaceholders(null);
    
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

// Auto-detect board dimensions from FEN
function getBoardDimensions(variant) {
    try {
        const startFen = ffish.startingFen(variant);
        const fenBoard = startFen.split(" ")[0];
        const ranks = fenBoard.split("/").length;
        const lastRank = fenBoard.split("/")[0].replace(/[^0-9a-z*]/gi, "");
        let files = lastRank.length;

        for (const match of lastRank.matchAll(/\d+/g)) {
            files += parseInt(match[0]) - match[0].length;
        }

        return { files, ranks };
    } catch (error) {
        console.warn(`Could not auto-detect dimensions for variant ${variant}:`, error);
        return { files: 8, ranks: 8 }; // Default to 8x8
    }
}

// Main conversion function - equivalent to Python pgn4_to_pgn()
function pgn4ToPgn(pgn4Text, overrideVariant, userFiles, userRanks) {
    if (!isInitialized) {
        throw new Error('Chess engine not initialized');
    }

    // Clean up PGN4 text - equivalent to Python regex substitutions
    let pgn4 = pgn4Text;
    
    let pgn = '';
    let variant = overrideVariant;
    let startFen = null;
    let files = userFiles;  // User override or will be auto-detected
    let ranks = userRanks;  // User override or will be auto-detected
    
    if (overrideVariant) {
        startFen = ffish.startingFen(overrideVariant);
        // Auto-detect dimensions if user didn't specify
        if (!userFiles || !userRanks) {
            const autoDimensions = getBoardDimensions(overrideVariant);
            files = userFiles || autoDimensions.files;
            ranks = userRanks || autoDimensions.ranks;
            console.log(`Auto-detected dimensions for ${overrideVariant}: ${files}x${ranks}`);
        }
    } else if (!files || !ranks) {
        // Default to 8x8 if no variant and no user input
        files = files || 8;
        ranks = ranks || 8;
    }
    
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
    
    const lines = pgn4.split(/\r?\n/);
    let moves = []; // Track moves across the entire game
    
    for (const line of lines) {
        if (line.startsWith('[')) {
            moves = []; // Reset moves for new game
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
                            throw new Error(`Unsupported variant: ${variant}, available variants are: ${availableVariants.join(', ')}`);
                        }
                        startFen = ffish.startingFen(variant);
                        
                        // Auto-detect dimensions if user didn't specify
                        if (!userFiles || !userRanks) {
                            const autoDimensions = getBoardDimensions(variant);
                            files = userFiles || autoDimensions.files;
                            ranks = userRanks || autoDimensions.ranks;
                            console.log(`Auto-detected dimensions for ${variant}: ${files}x${ranks}`);
                        }
                    }
                } else if (!files || !ranks) {
                    // Default to 8x8 if no variant detected and no user input
                    files = files || 8;
                    ranks = ranks || 8;
                }
                
                // Match Python behavior: replace Site line with Variant line
                pgn += `[Variant "${variant.charAt(0).toUpperCase() + variant.slice(1)}"]\n`;
            } else {
                pgn += line + '\n';
            }
        } else {
            // Process move line using Python logic
            const processedLine = processMoveLine(line, variant, startFen, moves);
            pgn += processedLine + '\n';
        }
    }
    
    return pgn;
}

// Process a line containing moves - equivalent to Python logic
function processMoveLine(line, variant, startFen, moves) {
    const parts = line.split(/\s+/);
    
    for (let i = 0; i < parts.length; i++) {
        let move = parts[i].trim();
        
        if (!move) continue;
        
        // Skip move numbers and timestamps (equivalent to Python's isdigit() check and T,R,S)
        if (/^\d/.test(move) || move === 'T' || move === 'R' || move === 'S') {
            continue;
        }
        
        // Fix weird game end markers (equivalent to Python's rstrip('S').replace('+#', '#'))
        move = move.replace(/S$/, '').replace(/\+#/, '#');
        
        if (!move) continue;
        
        try {
            // Get current FEN after applying all previous moves (equivalent to pyffish.get_fen)
            const board = new ffish.Board(variant, startFen);
            for (const prevMove of moves) {
                board.push(prevMove);
            }
            const currentFen = board.fen();
            
            // Get legal moves (equivalent to pyffish.legal_moves)
            const legalMoves = board.legalMoves().split(' ').filter(m => m);
            
            // Create LAN to UCI mapping (equivalent to Python's lan_legals dict comprehension)
            const lanLegals = {};
            for (const uciMove of legalMoves) {
                try {
                    // Try to get LAN notation - if ffish.Notation is available, use it, otherwise try with parameter
                    let lanMove;
                    if (typeof ffish.Notation !== 'undefined' && ffish.Notation.LAN !== 'undefined') {
                        lanMove = board.sanMove(uciMove, ffish.Notation.LAN);
                    } else {
                        // Try different notation parameters to find LAN
                        lanMove = board.sanMove(uciMove, 0); // 0 often represents LAN
                    }
                    lanLegals[lanMove] = uciMove;
                } catch (e) {
                    // Skip moves that can't be converted to LAN
                }
            }
            
            // Check if move is in LAN legals (equivalent to Python's "if move in lan_legals")
            if (lanLegals[move]) {
                const uciMove = lanLegals[move];
                moves.push(uciMove);
                // Convert to SAN (default notation should be SAN)
                const sanMove = board.sanMove(uciMove);
                console.log(`Converting move: ${move} (LAN) -> ${uciMove} (UCI) -> ${sanMove} (SAN)`);
                parts[i] = sanMove;
            } else {
                // Try the move as UCI directly
                if (legalMoves.includes(move)) {
                    moves.push(move);
                    const sanMove = board.sanMove(move);
                    console.log(`Converting move: ${move} (UCI) -> ${sanMove} (SAN)`);
                    parts[i] = sanMove;
                } else {
                    console.warn(`Warning: Move ${move} not found in LAN or UCI format`);
                    console.log('Available LAN moves:', Object.keys(lanLegals));
                    console.log('Available UCI moves:', legalMoves.slice(0, 5), '...');
                }
            }
            
            board.delete();
        } catch (error) {
            console.warn(`Error processing move ${move}:`, error);
        }
    }
    
    return parts.join(' ');
}



function populateVariantDropdown() {
    if (!isInitialized) return;
    
    const select = document.getElementById('variant-select');
    const variantsString = ffish.variants();
      
    if (!variantsString || variantsString.trim() === '') {
        console.error('No variants available from ffish.variants()');
        return;
    }
    
    const variants = variantsString.split(' ').filter(v => v.trim() !== '');
    console.log('Parsed variants:', variants);
    
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
    
    // Add event listener to update dimension placeholders when variant changes
    select.addEventListener('change', function() {
        updateDimensionPlaceholders(this.value);
    });
}

function updateDimensionPlaceholders(variant) {
    const filesInput = document.getElementById('files-input');
    const ranksInput = document.getElementById('ranks-input');
    
    if (variant) {
        const dimensions = getBoardDimensions(variant);
        filesInput.placeholder = `Auto: ${dimensions.files}`;
        ranksInput.placeholder = `Auto: ${dimensions.ranks}`;
    } else {
        filesInput.placeholder = 'Auto: 8';
        ranksInput.placeholder = 'Auto: 8';
    }
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
        // Get user-specified dimensions, or null to enable auto-detection
        const filesInput = document.getElementById('files-input').value.trim();
        const ranksInput = document.getElementById('ranks-input').value.trim();
        const userFiles = filesInput ? parseInt(filesInput) : null;
        const userRanks = ranksInput ? parseInt(ranksInput) : null;
        
        try {
            updateStatus('Converting PGN4 to PGN...');
            convertBtn.disabled = true;
            
            // Use setTimeout to allow UI to update
            setTimeout(() => {
                try {
                    const result = pgn4ToPgn(pgn4Text, overrideVariant, userFiles, userRanks);
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