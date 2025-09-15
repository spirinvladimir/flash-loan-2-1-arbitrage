import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

createPublicClient({
  chain: sepolia,
  transport: http()
})
.readContract({
    address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    abi: [{
      name: 'getReservesList',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'address[]' }]
    }],
    functionName: 'getReservesList'
})
.then(_ =>j
    console.log(JSON.stringify(_, null, 2))
)
