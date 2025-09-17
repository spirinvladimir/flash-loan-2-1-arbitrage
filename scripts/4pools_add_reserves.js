fs = require('fs')
pool_array = require('./data/4_pools.json')
const { createPublicClient, http, formatUnits } = require('viem')
const { mainnet } = require('viem/chains')
const client = createPublicClient({
  chain: mainnet,
  transport: http()
})
const pair_abi = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: '_reserve0', type: 'uint112' },
      { name: '_reserve1', type: 'uint112' },
      { name: '_blockTimestampLast', type: 'uint32' }
    ],
    type: 'function'
  }
]
const cache = {}
const outputDecimals = 18
const show_progress = (current, total) => {
  const percent = Math.round(current/total*100)
  process.stdout.write(`\rProgress: [${'='.repeat(percent/2)}${' '.repeat(50-percent/2)}] ${percent}%`)
}
const get_price = (address, decimal0, decimal1) => client.readContract({
  address: address,
  abi: pair_abi,
  functionName: 'getReserves'
}).then(([reserve0, reserve1]) => {
  if (reserve0 === 0n || reserve1 === 0n) {
    return { price0: 0, price1: 0 }
  }
  var numerator, denominator, price
  numerator = reserve1 * 10n ** BigInt(decimal0)
  denominator = reserve0 * 10n ** BigInt(decimal1)
  price = (numerator * 10n ** BigInt(outputDecimals)) / denominator
  const price0 = Number(formatUnits(price, outputDecimals))
  numerator = reserve0 * 10n ** BigInt(decimal1)
  denominator = reserve1 * 10n ** BigInt(decimal0)
  price = (numerator * 10n ** BigInt(outputDecimals)) / denominator
  const price1 = Number(formatUnits(price, outputDecimals))
  return { price0, price1 }
})
pool_array.reduce((promise_chain, chunk, chunk_index) =>
  chunk.reduce((promise_chain, pool, pool_index) =>
    promise_chain.then(() => {
      show_progress(chunk_index + 1, pool_array.length)
      if (cache[pool.address]) {
        pool.price = cache[pool.address]
        return Promise.resolve()
      }
      return get_price(pool.address, pool.decimal0, pool.decimal1)
        .then(price => {
          cache[pool.address] = price
          pool.price = price
        })
        .catch(error => {
          console.error(`Error fetching price for ${pool.address}:`, error.message)
          cache[pool.address] = null
          pool.price = null
        })
    }), promise_chain), Promise.resolve())
  .then(() => {
    console.log('Saved ./data/4_pools_reserves.json')
    fs.writeFileSync('./data/4_pools_reserves.json', JSON.stringify(pool_array), 'utf8')
  })
  .catch(error => console.error('Error processing array:', error))
