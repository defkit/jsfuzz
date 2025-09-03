const zlib = require('zlib');

async function fuzz(buf) {
    try {
        // Decompress the buffer
        const decompressed = zlib.inflateSync(buf);
        if (decompressed.toString() === "BOOM") {
            throw new Error("PANIC: Found BOOM string in decompressed data!");
        }
        
    } catch (e) {
        console.log("error: " + e.message);
        if (e.message.includes("PANIC")) {
            throw e;
        }
    }
}

function mutate(buf) {
    try {
        // Try to decompress, modify the content, and recompress
        let decompressed;
        try {
            decompressed = zlib.inflateSync(buf);
        } catch (e) {
            // If decompression fails, create some random data to compress
            decompressed = Buffer.from('test data ' + Math.random());
        }
        
        // Apply mutations to the decompressed data
        let mutated = Buffer.alloc(decompressed.length);
        decompressed.copy(mutated);
        
        
        const numMutations = 1;
        for (let i = 0; i < numMutations; i++) {
            const mutationType = Math.floor(Math.random() * 5);
            
            switch (mutationType) {
                case 0: // Replace random bytes
                    if (mutated.length > 0) {
                        const pos = Math.floor(Math.random() * mutated.length);
                        mutated[pos] = Math.floor(Math.random() * 256);
                    }
                    break;
                    
                case 1: // Insert "BOOM" string with a really low probability to trigger panic
                    if (Math.random() < 0.0001) {
                        mutated = Buffer.from("BOOM");
                    }
                    break;
                    
                case 2: // Append random data
                    const appendData = Buffer.from(String.fromCharCode(Math.floor(Math.random() * 256)));
                    mutated = Buffer.concat([mutated, appendData]);
                    break;
                    
                case 3: // Truncate data
                    if (mutated.length > 1) {
                        const newLength = Math.floor(Math.random() * mutated.length);
                        mutated = mutated.slice(0, newLength);
                    }
                    break;
            }
        }
        
        // Recompress the mutated data
        try {
            return zlib.deflateSync(mutated);
        } catch (e) {
            // If recompression fails, return original buffer with simple mutations
            console.log("recompression failed");
            let result = Buffer.alloc(buf.length);
            buf.copy(result);
            if (result.length > 0) {
                const pos = Math.floor(Math.random() * result.length);
                result[pos] = Math.floor(Math.random() * 256);
            }
            return result;
        }
        
    } catch (e) {
        // If anything fails, fall back to simple byte-level mutations
        let result = Buffer.alloc(buf.length);
        buf.copy(result);
        
        // Simple mutations as fallback
        const numMutations = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numMutations; i++) {
            if (result.length > 0) {
                const pos = Math.floor(Math.random() * result.length);
                result[pos] = Math.floor(Math.random() * 256);
            }
        }
        
        return result;
    }
}

module.exports = {
    fuzz,
    mutate
};