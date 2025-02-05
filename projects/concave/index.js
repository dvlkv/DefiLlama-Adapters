const sdk = require('@defillama/sdk')
const { ohmTvl } = require('../helper/ohm')
const { uniTvlExport } = require('../helper/calculateUniTvl');
const { genericUnwrapCvx } = require('../helper/unwrapLPs');


// Treasury backing the CNV price, similar to OHM so using the ohm wrapper
const treasury = '0x226e7af139a0f34c6771deb252f9988876ac1ced' 
const etherAddress = '0x0000000000000000000000000000000000000000'
const cnv_token = '0x000000007a58f5f58e697e51ab0357bc9e260a04'
const stakingAddress = '0x0000000000000000000000000000000000000000'
const treasuryTokens = [
    ['0x6b175474e89094c44da98b954eedeac495271d0f', false], //DAI
    // ['0x0ab87046fBb341D058F17CBC4c1133F25a20a52f', false], //gOHM
]
const gemSwap_factory = '0x066a5cb7ddc6d55384e2f6ca13d5dd2cd2685cbd'

// Generic CRV position unwrapping, useful for a CVX position unwrapping
// CVX treasury position parameters
const cvxDOLA_3CRV_BaseRewardPool = '0x835f69e58087e5b6bffef182fe2bf959fe253c3c'

async function tvl(timestamp, ethBlock, chainBlocks) {
  // Count TVL of amm
  const balances = {}

  // Get ether balance
  balances[etherAddress] = (await sdk.api.eth.getBalance({ target: treasury, ethBlock })).output

  // Compute the balance of the treasury of the CVX position and unwrap
  await genericUnwrapCvx(balances, treasury, cvxDOLA_3CRV_BaseRewardPool, ethBlock, 'ethereum')

  return balances
};


module.exports = ohmTvl(treasury, treasuryTokens, 'ethereum', stakingAddress, cnv_token, undefined, undefined, true)
module.exports.ethereum.tvl = sdk.util.sumChainTvls([tvl, module.exports.ethereum.tvl, uniTvlExport(gemSwap_factory)])
delete module.exports.ethereum.staking
module.exports.methodology = 'Count the treasury assets backing the CNV price + LP assets in the AMM Gemswap'
