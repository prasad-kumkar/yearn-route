// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./UniswapLiteBase.sol";

// yDAI v3 Contract –– https://github.com/yearn/itoken/blob/master/contracts/YDAIv3.sol
interface IYDAI {
    function deposit(uint256 _amount) external;

    function withdraw(uint256 _shares) external;

    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }
}

contract MyDapp is UniswapLiteBase {
    address constant daiAddress = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant yDaiAddress = 0xC2cB1040220768554cf699b0d863A3cd4324ce32;

    using SafeMath for uint256;

    IERC20 dai;
    IYDAI yDai;

    constructor() public {
        // DAI mainnet address
        dai = IERC20(daiAddress);
        // yDAI v3 mainnet address
        yDai = IYDAI(yDaiAddress);
    }

    function getEthPriceInDai() public view returns (uint256 tokenAmount) {
        return _getEthToTokenInput(daiAddress, 1 ether);
    }

    function swapEthToDai() external payable returns (uint256 tokensBought) {
        uint256 amount = _ethToToken(daiAddress, msg.value);
        IERC20(daiAddress).transfer(msg.sender, amount);
        return amount;
    }

    // Invest DAI into yearn - calls the deposit function of yDAI v3 contract
    // Received yDAI is stored in this contract's deposit mapping (eg USER1 => 20yDAI)
    // Input –– Amount of DAI
    function enter(uint256 amount) external {
        require(amount < dai.balanceOf(msg.sender), "Insufficient Balance");

        dai.transferFrom(msg.sender, address(this), amount);

        dai.approve(address(yDai), amount);

        uint256 start_balance = yDai.balanceOf(address(this));
        yDai.deposit(amount);
        uint256 end_balance = yDai.balanceOf(address(this));

        yDai.transfer(msg.sender, end_balance.sub(start_balance));
    }

    // Exit DAI investment - calls the withdraw function of yDAI v3 contract
    // Input –– Amount of yDAI
    function exit(uint256 amount) external {
        require(amount < yDai.balanceOf(msg.sender), "Insufficient Balance");

        yDai.transferFrom(msg.sender, address(this), amount);

        yDai.approve(address(yDai), amount);

        uint256 start_balance = dai.balanceOf(address(this));
        yDai.withdraw(amount);
        uint256 end_balance = dai.balanceOf(address(this));

        dai.transfer(msg.sender, end_balance.sub(start_balance));
    }

}
