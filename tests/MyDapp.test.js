require("dotenv").config();
jest.setTimeout(100000);

const { ethers } = require("ethers");
const erc20 = require("@studydefi/money-legos/erc20");

const MyDappArtifact = require("../build/contracts/MyDapp.json");
const IERC20Artifact = require("../build/contracts/IERC20.json");
const { it } = require("ethers/wordlists");

const web3 = require('web3');

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());

describe("initial conditions", () => {
  let wallet, daiContract, myDapp;

  beforeAll(async () => {
    wallet = global.wallet;

    daiContract = new ethers.Contract(erc20.dai.address, erc20.dai.abi, wallet);
    yDaiContract = new ethers.Contract('0xC2cB1040220768554cf699b0d863A3cd4324ce32', erc20.dai.abi, wallet);

    myDapp = new ethers.Contract(
      MyDappArtifact.networks['1'].address,
      MyDappArtifact.abi,
      wallet,
    );
  });

  // check eth price
  test("check ETH price in DAI is between 0 and 10000", async () => {
    const ethPriceWei = await myDapp.getEthPriceInDai();
    const ethPrice = parseFloat(fromWei(ethPriceWei));

    expect(ethPrice).toBeGreaterThan(0);
    expect(ethPrice).toBeLessThan(10000);
  });

  test("buy DAI with 5 ETH from Uniswap", async () => {
    // confirm we have chainId of 1
    const network = await wallet.provider.getNetwork();
    expect(network.chainId).toBe(1);

    // collect info on state before the swap
    const ethBefore = await wallet.getBalance();
    const daiBefore = await daiContract.balanceOf(wallet.address);
    const ethPrice = await myDapp.getEthPriceInDai();

    // do the actual swapping
    await myDapp.swapEthToDai({
      gasLimit: 4000000,
      value: ethers.utils.parseEther("5"),
    });

    // collect info on state after the swap
    const ethAfter = await wallet.getBalance();
    const daiAfter = await daiContract.balanceOf(wallet.address);
    
    // check DAI gained
    const daiGained = parseFloat(fromWei(daiAfter.sub(daiBefore)));
    const expectedDaiGained = parseFloat(fromWei(ethPrice.mul(5)));
    expect(daiGained).toBeCloseTo(expectedDaiGained, -3);

    // check ETH lost
    const ethLost = parseFloat(fromWei(ethBefore.sub(ethAfter)));
    expect(ethLost).toBeCloseTo(5);
  });

  // Approve 1000 dai to invest
  test("approve 1000 dai for myDapp contract", async() => {
    await daiContract.approve(myDapp.address, toWei(1000));
    const allowance = await daiContract.allowance(wallet.address, myDapp.address)
    expect(parseFloat(fromWei(allowance))).toBe(1000);
  });

  // Invest by calling 'enter' function of myDapp
  test("enter investment with 1000 dai", async() => {

    let yDaiBalanceOfUser = await yDaiContract.balanceOf(wallet.address);
    let daiBalanceOfUser = await daiContract.balanceOf(wallet.address);

    expect(parseFloat(fromWei(yDaiBalanceOfUser))).toBe(0)
    expect(parseFloat(fromWei(daiBalanceOfUser))).toBeGreaterThan(1000)

    console.log(
      `Initial Balance: \n yDaiBalanceOfUser : ${parseFloat(fromWei(yDaiBalanceOfUser))} \n daiBalanceOfUser : ${parseFloat(fromWei(daiBalanceOfUser))} 
       `
      );

    let initialDAI = await daiContract.balanceOf(wallet.address);

    await myDapp.enter(toWei(1000));

    yDaiBalanceOfUser = await yDaiContract.balanceOf(wallet.address);
    daiBalanceOfUser = await daiContract.balanceOf(wallet.address);

    expect(parseFloat(fromWei(yDaiBalanceOfUser))).toBeGreaterThan(0)
    expect(parseFloat(fromWei(daiBalanceOfUser))).toBe(fromWei(initialDAI) - 1000)

    console.log(
      `Balance after investing 1000 dai: \n yDaiBalanceOfUser : ${parseFloat(fromWei(yDaiBalanceOfUser))} \n daiBalanceOfUser : ${parseFloat(fromWei(daiBalanceOfUser))} 
       `
      );
  });

  // Approve spending 500 yDai
  test("approve 500 ydai for myDapp", async() => {
    await yDaiContract.approve(myDapp.address, toWei(500));
    const allowance = await yDaiContract.allowance(wallet.address, myDapp.address)
    expect(parseFloat(fromWei(allowance))).toBe(500);
  });

  // Exit position with 500 yDai by calling 'exit' function
  test("exit with 500 ydai", async() => {

    let initialyDAI = await yDaiContract.balanceOf(wallet.address);

    await myDapp.exit(toWei(500));

    let yDaiBalanceOfUser = await yDaiContract.balanceOf(wallet.address);
    let daiBalanceOfUser = await daiContract.balanceOf(wallet.address);

    expect(parseFloat(fromWei(yDaiBalanceOfUser))).toBeCloseTo(fromWei(initialyDAI)-500)
    expect(parseFloat(fromWei(daiBalanceOfUser))).toBeGreaterThan(0)

    console.log(
      `Balance after exiting with 500 ydai: \n yDaiBalanceOfUser : ${parseFloat(fromWei(yDaiBalanceOfUser))} \n daiBalanceOfUser : ${parseFloat(fromWei(daiBalanceOfUser))} `
      );
  });
});
