import type { Address } from "viem";

export const MAX_SUBJECT_LENGTH = 48;
export const MAX_NOTE_LENGTH = 140;

export const meterNoteAbi = [
  {
    type: "event",
    name: "EntrySaved",
    inputs: [
      { name: "entryId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "subject", type: "string", indexed: false },
      { name: "score", type: "uint8", indexed: false },
      { name: "note", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "saveEntry",
    stateMutability: "nonpayable",
    inputs: [
      { name: "subject", type: "string" },
      { name: "score", type: "uint8" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "entryId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getEntry",
    stateMutability: "view",
    inputs: [{ name: "entryId", type: "uint256" }],
    outputs: [
      { name: "maker", type: "address" },
      { name: "subject", type: "string" },
      { name: "score", type: "uint8" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextEntryId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredMeterNoteContractAddress =
  process.env.NEXT_PUBLIC_METER_NOTE_CONTRACT_ADDRESS?.trim();

export const meterNoteContractAddress = isAddressLike(configuredMeterNoteContractAddress)
  ? (configuredMeterNoteContractAddress as Address)
  : undefined;
