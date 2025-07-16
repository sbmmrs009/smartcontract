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
export const USDT_CONTRACT_ADDRESS = '0x0e4c1da11246fd2fb32a20df12f4d20e5caf5a968953b487481ed17c88ed0645';

// Payment Distributor Smart Contract Address - Deployed on BSC Testnet
export const PAYMENT_DISTRIBUTOR_ADDRESS = '0x708bb8cfacfb992d7b00e0afe415aec608d73f7c';

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
