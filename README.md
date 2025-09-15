# flash arbitrage contract (cross protocol)

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.0-black.svg)](https://docs.soliditylang.org/)
[![Network](https://img.shields.io/badge/Network-Ethereum-black.svg)](https://ethereum.org/)
[![AAVE](https://img.shields.io/badge/Flash%20Loans-AAVE-black.svg)](https://aave.com/)

## overview

high-efficiency arbitrage analysis toolkit for detecting profitable flash loan opportunities across decentralized exchanges.
the system identifies triangular arbitrage paths where price discrepancies between dex platforms create risk-free profit.

## core concept

arbitrage circle strategy between two protocols:

```
dex_1: [token A <-> token B] + [token B <-> token C]
dex_2: [token A <-> token C]

key: dex_1 has A-B and B-C pools but no A-C pool
     dex_2 has A-C pool completing the triangle
```

## execution strategy

1. **flash loan**: borrow token A from aave with zero capital
2. **path trading**: execute A→B→C through connected pools on dex_1
3. **direct swap**: convert C→A on dex_2 at different rate
4. **profit extraction**: repay loan + fees, keep difference

## optimization approach

### pool filtering
- pre-filter pools by aave token availability (only flashloanable tokens)
- binary format for fast lookups (3 ints per pool combination)
- eliminate pools with insufficient liquidity early

### combination analysis
- generate all possible 2-pool and 3-pool paths
- index tokens for o(1) lookups instead of string comparisons
- store only profitable combinations after simulation

### performance considerations
- dynamic pool lookup for maximum flexibility
- atomic execution in single transaction
- gas optimization through minimal storage operations
- pre-validated paths eliminate runtime checks

## data pipeline

raw pool data → token indexing → combination generation → aave filtering → profitability analysis → contract generation

the system processes millions of pool combinations to identify the few hundred profitable paths worth deploying.
