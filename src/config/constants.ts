import { getAddress } from 'ethers';

// BEP-20 USDT on BSC Testnet configuration
export const TESTNET_CONFIG = {
  chainId: '0x61', // 97 in hex (BSC Testnet)
  chainName: 'Binance Smart Chain Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: [
    'https://data-seed-prebsc-1-s1.binance.org:8545/',
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/'
  ],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
};

// BEP-20 USDT contract address on BSC Testnet
export const USDT_CONTRACT_ADDRESS = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';

// Payment Distributor Smart Contract Address - Set to null if not deployed yet
export const PAYMENT_DISTRIBUTOR_ADDRESS = null; // UPDATE WITH ACTUAL CONTRACT ADDRESS WHEN DEPLOYED

// Admin wallet address - receives total payment and handles distribution
export const ADMIN_WALLET_ADDRESS = '0xf52f981dafb26dc2ce86e48fbf6fbc2e35cd9444'; // UPDATE THIS WITH YOUR ADMIN WALLET

// Payment distribution - Total 0.05 USDT split into 2 recipients via Admin
export const PAYMENT_DISTRIBUTIONS = [
  {
    address: getAddress('0xf52f981dafb26dc2ce86e48fbf6fbc2e35cd9444'),
    amount: '0.02',
    percentage: '40%',
    label: 'Recipient 1'
  },
  {
    address: getAddress('0x73D5906Cbf60ecD8b5C0F89ae25fbEabeFdc894E'),
    amount: '0.03',
    percentage: '60%',
    label: 'Recipient 2'
  }
];

export const TOTAL_PAYMENT_AMOUNT = '0.05';
