combs = require('./address_mapping/4_pools_reserves.json')

combs = combs.filter(comb =>
    comb.every(pool =>
        pool.decimal0 != null &&
        pool.decimal1 != null &&
        pool.price?.price0 > 0 &&
        pool.price?.price1 > 0 &&
        pool.symbol0 &&
        pool.symbol1
    )
)

require('fs').writeFileSync('./address_mapping/4_good_pools.json', JSON.stringify(combs))
