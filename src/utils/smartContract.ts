import { BrowserProvider, Contract, parseUnits, formatUnits, getAddress } from 'ethers';
import { USDT_CONTRACT_ADDRESS, PAYMENT_DISTRIBUTOR_ADDRESS, TOTAL_PAYMENT_AMOUNT } from '../config/constants';

// BEP-20 USDT ABI (standard ERC-20/BEP-20 functions)
const USDT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// Payment Distributor Smart Contract ABI - Updated to match the Solidity contract
const PAYMENT_DISTRIBUTOR_ABI = [
  'function distributePayment() external',
  'function getRecipients() external view returns (tuple(address wallet, uint256 amount, string label)[])',
  'function getTotalAmount() external pure returns (uint256)',
  'function canUserPay(address user) external view returns (bool hasBalance, bool hasAllowance)',
  'event PaymentDistributed(address indexed payer, uint256 totalAmount, uint256 timestamp)',
  'event RecipientPaid(address indexed recipient, uint256 amount, string label)'
];

export interface SmartContractPaymentResult {
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

/**
 * Check if user has sufficient USDT balance and allowance for smart contract payment
 */
export const checkPaymentEligibility = async (
  provider: BrowserProvider,
  userAddress: string
): Promise<{
  hasBalance: boolean;
  hasAllowance: boolean;
  currentBalance: string;
  currentAllowance: string;
  requiredAmount: string;
}> => {
  try {
    const usdtContract = new Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    
    // Get user's USDT balance
    const balance = await usdtContract.balanceOf(userAddress);
    const decimals = await usdtContract.decimals();
    const currentBalance = formatUnits(balance, decimals);
    
    // Get current allowance for the smart contract
    const allowance = await usdtContract.allowance(userAddress, PAYMENT_DISTRIBUTOR_ADDRESS);
    const currentAllowance = formatUnits(allowance, decimals);
    
    // Get required amount
    const requiredAmount = TOTAL_PAYMENT_AMOUNT;
    const requiredAmountWei = parseUnits(requiredAmount, decimals);
    
    // Check eligibility
    const hasBalance = balance >= requiredAmountWei;
    const hasAllowance = allowance >= requiredAmountWei;
    
    return {
      hasBalance,
      hasAllowance,
      currentBalance,
      currentAllowance,
      requiredAmount
    };
  } catch (error) {
    console.error('Error checking payment eligibility:', error);
    throw new Error('Failed to check payment eligibility. Please ensure you are connected to BSC Testnet.');
  }
};

/**
 * Approve USDT spending for the smart contract
 */
export const approveUSDTSpending = async (
  provider: BrowserProvider
): Promise<string> => {
  try {
    const signer = await provider.getSigner();
    const usdtContract = new Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer);
    
    // Get decimals for proper amount calculation
    const decimals = await usdtContract.decimals();
    const approvalAmount = parseUnits(TOTAL_PAYMENT_AMOUNT, decimals);
    
    console.log(`Approving ${TOTAL_PAYMENT_AMOUNT} USDT for smart contract...`);
    
    // Approve the smart contract to spend USDT
    const tx = await usdtContract.approve(PAYMENT_DISTRIBUTOR_ADDRESS, approvalAmount);
    
    console.log('Approval transaction submitted:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Approval transaction failed');
    }
    
    // Verify the allowance was set correctly after confirmation
    const updatedAllowance = await usdtContract.allowance(await signer.getAddress(), PAYMENT_DISTRIBUTOR_ADDRESS);
    const requiredAmountWei = parseUnits(TOTAL_PAYMENT_AMOUNT, decimals);
    
    if (updatedAllowance < requiredAmountWei) {
      throw new Error(`Approval failed to set sufficient allowance. Required: ${TOTAL_PAYMENT_AMOUNT} USDT, but allowance is only ${formatUnits(updatedAllowance, decimals)} USDT`);
    }
    
    console.log('USDT spending approved successfully');
    return tx.hash;
    
  } catch (error: any) {
    console.error('USDT approval failed:', error);
    
    if (error.code === 4001) {
      throw new Error('USDT approval rejected by user');
    } else if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient BNB for gas fees');
    } else if (error.message?.includes('missing trie node')) {
      throw new Error('Network connectivity issue. Please try again in a moment.');
    } else {
      throw new Error(`USDT approval failed: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Execute smart contract payment distribution - TRUE SMART CONTRACT APPROACH
 * User approves once, smart contract handles internal distribution
 */
export const executeSmartContractPayment = async (
  provider: BrowserProvider
): Promise<SmartContractPaymentResult> => {
  try {
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log('Executing smart contract payment distribution...');
    
    // Create smart contract instance
    const distributorContract = new Contract(PAYMENT_DISTRIBUTOR_ADDRESS, PAYMENT_DISTRIBUTOR_ABI, signer);
    
    // Verify contract is accessible
    try {
      await distributorContract.getTotalAmount();
    } catch (contractError) {
      throw new Error('Unable to connect to PaymentDistributor contract. Please check the contract address and network.');
    }
    
    // Check user eligibility via smart contract
    const [hasBalance, hasAllowance] = await distributorContract.canUserPay(userAddress);
    
    if (!hasBalance) {
      throw new Error(`Insufficient USDT balance. You need ${TOTAL_PAYMENT_AMOUNT} USDT to make this payment.`);
    }
    
    if (!hasAllowance) {
      throw new Error(`Insufficient USDT allowance. Please approve ${TOTAL_PAYMENT_AMOUNT} USDT for the smart contract first.`);
    }
    
    console.log('User eligibility confirmed. Executing smart contract payment...');
    
    // Execute the smart contract payment distribution
    // This single transaction will distribute to ALL recipients internally
    const tx = await distributorContract.distributePayment();
    
    console.log('Smart contract payment transaction submitted:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Smart contract payment transaction failed');
    }
    
    console.log('Smart contract payment confirmed:', receipt.hash);
    
    // Get recipient details from smart contract
    const recipients = await distributorContract.getRecipients();
    
    // Format recipients data for display
    const formattedRecipients = recipients.map((recipient: any) => ({
      address: recipient.wallet,
      amount: formatUnits(recipient.amount, 18), // USDT has 18 decimals
      label: recipient.label
    }));
    
    console.log('Payment distribution completed successfully');
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      recipients: formattedRecipients,
      totalAmount: TOTAL_PAYMENT_AMOUNT,
      timestamp: new Date()
    };
    
  } catch (error: any) {
    console.error('Smart contract payment failed:', error);
    
    if (error.message?.includes('Insufficient USDT balance') || error.message?.includes('Insufficient USDT allowance')) {
      throw error;
    } else if (error.code === 4001) {
      throw new Error('Smart contract payment rejected by user');
    } else if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient BNB for gas fees');
    } else if (error.message?.includes('execution reverted')) {
      throw new Error('Smart contract execution failed. Please check your USDT balance and allowance.');
    } else if (error.message?.includes('Unable to connect to PaymentDistributor contract')) {
      throw error;
    } else if (error.message?.includes('missing trie node')) {
      throw new Error('Network connectivity issue. Please try again in a moment.');
    } else {
      throw new Error(`Smart contract payment failed: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Get smart contract recipient details
 */
export const getSmartContractRecipients = async (provider: BrowserProvider) => {
  try {
    const distributorContract = new Contract(PAYMENT_DISTRIBUTOR_ADDRESS, PAYMENT_DISTRIBUTOR_ABI, provider);
    const recipients = await distributorContract.getRecipients();
    
    return recipients.map((recipient: any) => ({
      address: recipient.wallet,
      amount: formatUnits(recipient.amount, 18),
      label: recipient.label
    }));
  } catch (error) {
    console.error('Failed to get smart contract recipients:', error);
    throw new Error('Failed to load payment recipients from smart contract');
  }
};