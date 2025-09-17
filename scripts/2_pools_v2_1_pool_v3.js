p2 = require('./data/pool-pairs-pairs-1758012719992.json').results
v3 = require('./data/v3.json')

res = p2.filter(comb => {
    A = comb.pool1.otherToken
    C = comb.pool2.otherToken
    return v3.some(pool =>
        (pool.tokenA == A && pool.tokenB == C) ||
        (pool.tokenA == C && pool.tokenB == A)
    )
})

console.log(res.length)
