fs = require('fs')
pools = require('./address_mapping/pools_and_tokens.json').pairs
tokens = require('./address_mapping/4_tokens.json')
const b = fs.readFileSync('4_tokens.bin')

const show_progress = (current, total) => {
    const percent = Math.round(current/total*100)
    process.stdout.write(`\rProgress: [${'='.repeat(percent/2)}${' '.repeat(50-percent/2)}] ${percent}%`)
}

const a = []
console.log('Search token addresses')
for (var i = 0, it, token; i < b.length - 4; i += 4) {
    show_progress(i, b.length - 4)
    it = b.readInt32LE(i)
    token = tokens.find(_ => _[0] == it)
    a.push(token)
}
var wrong_combs = 0
var result = []

for (var i = 0, A, B, C, D, AB, BD, CD, AC; i < a.length; i += 4) {
    show_progress(i, a.length)
    A = a[i + 0]
    B = a[i + 1]
    C = a[i + 2]
    D = a[i + 3]
    if (A == null || B == null || C == null || D == null) {
        wrong_combs++
        continue
    }
    AB = BD = CD = AC = null
    for (var j = 0, pool; j < pools.length; j++) {
        pool = pools[j]
        if (pool.token0 == A[1] && pool.token1 == B[1]) {
            AB = pool
            AB.decimal0 = A[2]
            AB.symbol0 = A[3]
            AB.decimal1 = B[2]
            AB.symbol1 = B[3]
        }
        if (pool.token0 == B[1] && pool.token1 == A[1]) {
            AB = pool
            AB.decimal0 = B[2]
            AB.symbol0 = B[3]
            AB.decimal1 = A[2]
            AB.symbol1 = A[3]
        }
        if (pool.token0 == B[1] && pool.token1 == D[1]) {
            BD = pool
            BD.decimal0 = B[2]
            BD.symbol0 = B[3]
            BD.decimal1 = D[2]
            BD.symbol1 = D[3]
        }
        if (pool.token0 == D[1] && pool.token1 == B[1]) {
            BD = pool
            BD.decimal0 = D[2]
            BD.symbol0 = D[3]
            BD.decimal1 = B[2]
            BD.symbol1 = B[3]
        }
        if (pool.token0 == C[1] && pool.token1 == D[1]) {
            CD = pool
            CD.decimal0 = C[2]
            CD.symbol0 = C[3]
            CD.decimal1 = D[2]
            CD.symbol1 = D[3]
        }
        if (pool.token0 == D[1] && pool.token1 == C[1]) {
            CD = pool
            CD.decimal0 = D[2]
            CD.symbol0 = D[3]
            CD.decimal1 = C[2]
            CD.symbol1 = C[3]
        }
        if (pool.token0 == A[1] && pool.token1 == C[1]) {
            AC = pool
            AC.decimal0 = A[2]
            AC.symbol0 = A[3]
            AC.decimal1 = C[2]
            AC.symbol1 = C[3]

        }
        if (pool.token0 == C[1] && pool.token1 == A[1]) {
            AC = pool
            AC.decimal0 = C[2]
            AC.symbol0 = C[3]
            AC.decimal1 = A[2]
            AC.symbol1 = A[3]
        }
    }
    if (AB == null || BD == null || CD == null || AC == null) {
        wrong_combs++
        continue
    }
    result.push([AB, BD, CD, AC])
}
console.log('Wrong combs', wrong_combs)
console.log('Good combs', result.length)
fs.writeFileSync('./address_mapping/4_pools.json', JSON.stringify(result), 'utf8')
console.log('4 pools combs saved at: ./address_mapping/4_pools.json')
