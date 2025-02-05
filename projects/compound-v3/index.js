const sdk = require("@defillama/sdk");
const BigNumber = require("bignumber.js");
const { lendingMarket } = require("../helper/methodologies");

const USDCV3 = "0xc3d688B66703497DAA19211EEdff47f25384cdc3";

async function v3Tvl(balances, block, borrowed) {
  const numMarkets = +(
    await sdk.api.abi.call({
      target: USDCV3,
      block,
      abi:'uint8:numAssets',
    })
  ).output;

  const markets = (
    await sdk.api.abi.multiCall({
      abi: "function getAssetInfo(uint8 i) view returns (tuple(uint8 offset, address asset, address priceFeed, uint64 scale, uint64 borrowCollateralFactor, uint64 liquidateCollateralFactor, uint64 liquidationFactor, uint128 supplyCap))",
      block,
      calls: Array.from({ length: numMarkets }).map((_, i) => ({
        target: USDCV3,
        params: i,
      })),
    })
  ).output.map(({ output }) => output.asset);

  const collateral = (
    await sdk.api.abi.multiCall({
      abi: "erc20:balanceOf",
      block,
      calls: [...markets, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"].map((market) => ({
        target: market,
        params: USDCV3,
      })),
    })
  )

  const borrows = (
    await sdk.api.abi.call({
      target: USDCV3,
      block,
      abi: 'uint256:totalBorrow',
    })
  ).output;
  const borrowedToken = (
    await sdk.api.abi.call({
      target: USDCV3,
      block,
      abi: 'address:baseToken',
    })
  ).output;

  if (borrowed) {
    balances[borrowedToken] = BigNumber(balances[borrowedToken] || 0)
      .plus(borrows)
      .toFixed();
  } else {
    sdk.util.sumMultiBalanceOf(balances, collateral)
  }

  return balances;
}

async function borrowed(timestamp, block) {
  const balances = {};
  await v3Tvl(balances, block, true);
  return balances;
}

async function tvl(timestamp, block) {
  let balances = {};

  await v3Tvl(balances, block, false);

  return balances;
}

module.exports = {
  timetravel: true,
  ethereum: {
    tvl,
    borrowed,
  },
  methodology: `${lendingMarket}. TVL is calculated by getting the market addresses from comptroller and calling the totalsCollaterals() on-chain method to get the amount of tokens locked in each of these addresses, then we get the price of each token from coingecko.`,
};
