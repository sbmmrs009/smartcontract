export interface WalletInfo {
  name: string;
  icon: string;
  installed: boolean;
  provider?: any;
}

export interface PaymentDistribution {
  address: string;
  amount: string;
  percentage: string;
}

export interface TransactionDetails {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: Date;
  distributions: PaymentDistribution[];
  walletName?: string;
  isSmartContract?: boolean;
  isAdminPayment?: boolean;
  adminWallet?: string;
  gasUsed?: string;
  blockNumber?: number;
  distributionTransactions?: Array<{
    hash: string;
    recipient: string;
    amount: string;
    label: string;
  }>;
}

export interface WalletState {
  connected: boolean;
  address: string;
  balance: string;
  chainId: string;
  provider?: any;
  walletName?: string;
}

export interface SmartContractPayment {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  recipients: Array<{
    address: string;
    amount: string;
    label: string;
  }>;
  totalAmount: string;
  timestamp: Date;
}