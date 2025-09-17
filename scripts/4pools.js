fs = require('fs')
token_array = require('./data/4_tokens.json')
const { createPublicClient, http } = require('viem')
const { mainnet } = require('viem/chains')

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

const erc20_abi = [
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
]

const show_progress = (current, total) => {
  const percent = Math.round(current/total*100)
  process.stdout.write(`\rProgress: [${'='.repeat(percent/2)}${' '.repeat(50-percent/2)}] ${percent}%`)
}

const get_token_info = address => Promise.all(
  ['decimals', 'symbol'].map(fn => client.readContract({
    address: address,
    abi: erc20_abi,
    functionName: fn
  }))
)


token_array.reduce((promise_chain, current_item, i) =>
  promise_chain.then(() => {
    const [number, address] = current_item
    show_progress(i + 1, token_array.length)

    return get_token_info(address)
      .then(([decimals, symbol]) => {
        token_array[i][2] = decimals
        token_array[i][3] = symbol
      })
      .catch(error => {
        console.error(`Error fetching info for ${address}:`, error.message)
        token_array[i][2] = null
        token_array[i][3] = null
      })
  }), Promise.resolve())
  .then(() => {
    console.log('Saved ./data/4_tokens.json')
    fs.writeFileSync('./data/4_tokens.json', JSON.stringify(token_array), 'utf8')
  })
  .catch(error => console.error('Error processing array:', error))
