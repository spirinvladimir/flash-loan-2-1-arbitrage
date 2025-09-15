const { createPublicClient, http } = require('viem')
const { mainnet } = require('viem/chains')
const fs = require('fs')

const pool = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'
const fn = 'aave_tokens_mainnet.json'

createPublicClient({
  chain: mainnet,
  transport: http()
})
.readContract({
    address: pool,
    abi: [{
      name: 'getReservesList',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'address[]' }]
    }],
    functionName: 'getReservesList'
})
.then(_ => {
    console.log('AAVE pool', pool, 'provide flash loans in', _.length, 'tokens')
    console.log('List of addresses saved to', fn)
    fs.writeFileSync(fn, JSON.stringify(_))
})
