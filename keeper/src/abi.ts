// Minimal ABI for AutoSaveVault — only what the keeper needs.
export const vaultAbi = [
  {
    type: "function",
    name: "previewDue",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "executeSave",
    stateMutability: "nonpayable",
    inputs: [{ name: "user", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getPlan",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "amount", type: "uint128" },
          { name: "interval", type: "uint64" },
          { name: "nextRun", type: "uint64" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "PlanCreated",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint128", indexed: false },
      { name: "interval", type: "uint64", indexed: false },
      { name: "nextRun", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PlanCancelled",
    inputs: [{ name: "user", type: "address", indexed: true }],
  },
] as const;
