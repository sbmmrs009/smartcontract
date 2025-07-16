// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBEP20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract PaymentDistributor {
    address public owner;
    IBEP20 public usdtToken;
    
    // Payment distribution configuration
    struct Recipient {
        address wallet;
        uint256 amount;
        string label;
    }
    
    Recipient[] public recipients;
    uint256 public constant TOTAL_AMOUNT = 50000000000000000; // 0.05 USDT (18 decimals)
    
    // Events
    event PaymentDistributed(
        address indexed payer,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event RecipientPaid(
        address indexed recipient,
        uint256 amount,
        string label
    );
    
    constructor(address _usdtToken) {
        owner = msg.sender;
        usdtToken = IBEP20(_usdtToken);
        
        // Initialize recipients with your specified distribution
        recipients.push(Recipient({
            wallet: 0xf52f981dafb26dc2ce86e48fbf6fbc2e35cd9444,
            amount: 20000000000000000, // 0.02 USDT (18 decimals)
            label: "Recipient 1"
        }));
        
        recipients.push(Recipient({
            wallet: 0x73D5906Cbf60ecD8b5C0F89ae25fbEabeFdc894E,
            amount: 30000000000000000, // 0.03 USDT (18 decimals)
            label: "Recipient 2"
        }));
    }
    
    /**
     * @dev Distributes USDT payment to all recipients in a SINGLE transaction
     * User approves this contract once for 0.05 USDT, contract handles internal distribution
     */
    function distributePayment() external {
        address payer = msg.sender;
        
        // Check if user has enough USDT balance
        require(
            usdtToken.balanceOf(payer) >= TOTAL_AMOUNT,
            "Insufficient USDT balance"
        );
        
        // Check if user has approved enough USDT for this contract
        require(
            usdtToken.allowance(payer, address(this)) >= TOTAL_AMOUNT,
            "Insufficient USDT allowance. Please approve 0.05 USDT first."
        );
        
        // Transfer total USDT from user to this contract first
        require(
            usdtToken.transferFrom(payer, address(this), TOTAL_AMOUNT),
            "Failed to transfer USDT to contract"
        );
        
        // Distribute to each recipient from the contract
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                usdtToken.transfer(recipients[i].wallet, recipients[i].amount),
                string(abi.encodePacked("Failed to transfer to ", recipients[i].label))
            );
            
            emit RecipientPaid(recipients[i].wallet, recipients[i].amount, recipients[i].label);
        }
        
        emit PaymentDistributed(payer, TOTAL_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Get all recipient details
     */
    function getRecipients() external view returns (Recipient[] memory) {
        return recipients;
    }
    
    /**
     * @dev Get total payment amount
     */
    function getTotalAmount() external pure returns (uint256) {
        return TOTAL_AMOUNT;
    }
    
    /**
     * @dev Check if user has sufficient balance and allowance
     */
    function canUserPay(address user) external view returns (bool hasBalance, bool hasAllowance) {
        hasBalance = usdtToken.balanceOf(user) >= TOTAL_AMOUNT;
        hasAllowance = usdtToken.allowance(user, address(this)) >= TOTAL_AMOUNT;
    }
    
    /**
     * @dev Emergency function to update recipient (only owner)
     */
    function updateRecipient(uint256 index, address newWallet) external {
        require(msg.sender == owner, "Only owner can update recipients");
        require(index < recipients.length, "Invalid recipient index");
        recipients[index].wallet = newWallet;
    }
    
    /**
     * @dev Add new recipient (only owner)
     */
    function addRecipient(address wallet, uint256 amount, string memory label) external {
        require(msg.sender == owner, "Only owner can add recipients");
        recipients.push(Recipient({
            wallet: wallet,
            amount: amount,
            label: label
        }));
    }
    
    /**
     * @dev Emergency withdrawal function (only owner)
     */
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = usdtToken.balanceOf(address(this));
        if (balance > 0) {
            usdtToken.transfer(owner, balance);
        }
    }
}