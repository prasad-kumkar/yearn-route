# Yearn Route Contract

This project demonstrates interaction with yearn contract on mainnet.

Currently the following is demonstrated:

- Forking off Mainnet with [Ganache](https://github.com/trufflesuite/ganache-core)
- Forking off of a fork of Mainnet to run tests in parallel (thanks to [Jest](https://jestjs.io/))
- Checking token prices in DAI with Uniswap's on-chain contracts
- Swapping ETH for DAI from [Uniswap](https://uniswap.exchange/)
- Invest DAI in yearn contract by approving tokens and calling the custom `enter (uint256 amount)` function. User would receive the equivalent yDAI tokens in their wallet
- Exit position by depositing back yDai calling the `exit (uint256 amount)` function, Now, user would receive DAI back in their wallet

## Usage

1. Clone the repo or `npx truffle unbox defi`
2. Run `npm install`
3. Create a `.env` file with the following contents:

   ```
   MAINNET_NODE_URL=https://mainnet.infura.io/v3/<API_KEY_HERE>
   PRIV_KEY_TEST=<some private key>
   PRIV_KEY_DEPLOY=<some other private key>
   ```

   - Get an API key from: https://infura.io/
   - Both of the private keys can be any private key you choose:
     - `PRIV_KEY_DEPLOY` refers to an account specifically for deploying
     - `PRIV_KEY_TEST` refers to an account specifically for testing

4. Run `npm start` to start a local Ganache chain with forked Mainnet state
5. Run `npm run migrate` in order to compile and migrate the project's contracts to this local Ganache chain
6. Run `npm test` in order to run the tests.
   - Each test suite will fork off the local Ganache instance (yes, it's a fork of a fork) and create its own Ganache instance in-memory. This is to prevent out-of-order nonce issues since our tests are run in parallel by Jest.

## Testing

Some information about the test chains:

- `./tests/utils/test-chain.js` starts a test chain exposed at `http://127.0.0.1:8545` and our contracts need to be migrated to it with `truffle migrate` (or the `npm run migrate` script).

- `./tests/utils/test-environment.js` is instantiated for each and every test suite (i.e. test file in our case). It makes another Ganache instance in-memory that is forked off the local test-chain at `http://127.0.0.1:8545`

## Contracts

`UniswapLiteBase.sol` utilizes the interface contracts: `IUniswapExchange.sol` and `IUniswapFactory.sol` in order to provide more convenient internal functions.

`MyDapp.sol` then inherits from `UniswapLiteBase.sol` to expose convenient outward facing contract functions.
