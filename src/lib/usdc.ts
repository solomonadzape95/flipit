// Celo cUSD addresses
// Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a
// Alfajores (testnet): 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
// Sepolia (testnet): 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b
export const USDC = {
  // Using cUSD on Celo Sepolia for testnet (native Celo stablecoin)
  // cUSD uses 18 decimals (not 6 like USDC)
  address: (() => {
    const network = process.env.NEXT_PUBLIC_CELO_NETWORK;
    if (network === "mainnet") return "0x765DE816845861e75A25fCA122bb6898B8B1282a"; // cUSD on Celo mainnet
    if (network === "alfajores") return "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD on Alfajores
    return "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b"; // cUSD on Celo Sepolia (default)
  })() as `0x${string}`,
  symbol: "cUSD",
  decimals: 18, // cUSD uses 18 decimals
} as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
