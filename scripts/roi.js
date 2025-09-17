combs = require('./data/4_good_pools.json')
const start_amount = 100;

combs.forEach((comb, idx) => {
    let amt = start_amount;
    for (let i = 0; i < comb.length; i++) {
        const pool = comb[i];
        const next = comb[(i + 1) % comb.length];
        const common = pool.token0 === next.token0 || pool.token0 === next.token1 ? pool.token0 : pool.token1;
        const have = pool.token0 === common ? pool.token1 : pool.token0;
        amt *= have === pool.token0 ? pool.price.price1 : pool.price.price0;
    }
    console.log(`Comb ${idx}: ${amt.toFixed(8)}, ROI: ${((amt - start_amount) / start_amount * 100).toFixed(4)}%`);
});
