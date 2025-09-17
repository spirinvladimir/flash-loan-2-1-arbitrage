const fs = require('fs');
const { createPublicClient, http } = require('viem');
const { mainnet } = require('viem/chains');
const combs = require('./data/4_pools_reserves.json');

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

const erc20_abi = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
];


combs.reduce((chain, comb, i) =>
  comb.reduce((chain, pool, j) =>
    [pool.token0, pool.token1]
      .filter((_, k) => pool['decimal' + k] == null)
      .reduce((chain, token) =>
        chain.then(() =>
          client.readContract({
            address: token,
            abi: erc20_abi,
            functionName: 'decimals'
          })
            .then(decimal => {
                pool['decimal' + (token === pool.token0 ? 0 : 1)] = Number(decimal)
                console.log(token, decimal)
            })
            .catch(err => console.error(`Failed to get decimal for token ${token} in comb ${i}, pool ${j}:`, err))
        )
      , chain)
  , chain)
, Promise.resolve())
.then(() => {
    fs.writeFileSync('./data/4_pools_reserves.json', JSON.stringify(combs), 'utf8')
    console.log('All decimal values updated');
    console.log('Process completed');
})
.catch(err => console.error('Process failed:', err));
