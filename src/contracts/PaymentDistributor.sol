// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentDistributor is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public usdtToken;

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

    constructor(address _usdtToken) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid token address");
        usdtToken = IERC20(_usdtToken);

        address recipient1 = 0xF52F981daFb26Dc2ce86e48FBF6FBc2e35CD9444;
        address recipient2 = 0x73D5906Cbf60ecD8b5C0F89ae25fbEabeFdc894E;

        recipients.push(Recipient({
            wallet: recipient1,
            amount: 20000000000000000,
            label: "Recipient 1"
        }));

        recipients.push(Recipient({
            wallet: recipient2,
            amount: 30000000000000000,
            label: "Recipient 2"
        }));
    }

    function distributePayment() external {
        address payer = msg.sender;

        require(
            usdtToken.balanceOf(payer) >= TOTAL_AMOUNT,
            "Insufficient USDT balance"
        );

        require(
            usdtToken.allowance(payer, address(this)) >= TOTAL_AMOUNT,
            "Insufficient USDT allowance. Please approve 0.05 USDT first."
        );

        usdtToken.safeTransferFrom(payer, address(this), TOTAL_AMOUNT);

        for (uint256 i = 0; i < recipients.length; i++) {
            usdtToken.safeTransfer(recipients[i].wallet, recipients[i].amount);
            emit RecipientPaid(recipients[i].wallet, recipients[i].amount, recipients[i].label);
        }

        emit PaymentDistributed(payer, TOTAL_AMOUNT, block.timestamp);
    }

    function getRecipients() external view returns (Recipient[] memory) {
        return recipients;
    }

    function getTotalAmount() external pure returns (uint256) {
        return TOTAL_AMOUNT;
    }

    function canUserPay(address user) external view returns (bool hasBalance, bool hasAllowance) {
        hasBalance = usdtToken.balanceOf(user) >= TOTAL_AMOUNT;
        hasAllowance = usdtToken.allowance(user, address(this)) >= TOTAL_AMOUNT;
    }

    function updateRecipient(uint256 index, address newWallet) external onlyOwner {
        require(index < recipients.length, "Invalid recipient index");
        recipients[index].wallet = newWallet;
    }

    function addRecipient(address wallet, uint256 amount, string memory label) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(amount > 0, "Amount must be greater than zero");

        recipients.push(Recipient({
            wallet: wallet,
            amount: amount,
            label: label
        }));
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdtToken.balanceOf(address(this));
        if (balance > 0) {
            usdtToken.safeTransfer(owner(), balance);
        }
    }
}