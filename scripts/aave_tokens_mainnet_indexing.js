const fs = require('fs')
const tokens = require('./address_mapping/tokens.json')
const aave = require('./aave_tokens_mainnet.json')
let indexes = Array(aave.length).fill(null)

for (var i = 0; i < tokens.length; i++)
    for (var j = 0; j < aave.length; j++) {
        if (tokens[i] == aave[j]) {
            indexes[j] = i
            break
        }
    }

indexes = indexes.filter(_ => _ != null)

console.log(indexes)

// Create binary buffer: 4 bytes for length + 4 bytes per integer
const bufferSize = 4 + (indexes.length * 4)
const buffer = Buffer.alloc(bufferSize)

// Write array length as 32-bit integer (little-endian)
buffer.writeInt32LE(indexes.length, 0)

// Write each integer value as 32-bit integer (little-endian)
for (let i = 0; i < indexes.length; i++) {
    buffer.writeInt32LE(indexes[i], 4 + (i * 4))
}

// Save to binary file
fs.writeFileSync('aave_token_indexes.bin', buffer)
console.log(`Binary file saved: aave_token_indexes.bin (${bufferSize} bytes)`)
