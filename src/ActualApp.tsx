// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp';
import { /* CodePromise, */ ContractPromise } from '@polkadot/api-contract';
import { useEffect } from 'react';
import metadata from './artifacts/metadata.json';

// console.log('metadata:', metadata); // Logs the content of metadata.json.

export function ActualApp() {
  async function run() {
    // Construct
    const wsProvider = new WsProvider('wss://ws.test.azero.dev');
    const api = await ApiPromise.create({ provider: wsProvider });

    // returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    const allInjected = await web3Enable('my cool dapp');
    // console.log('allInjected:', allInjected);

    // returns an array of { address, meta: { name, source } }
    // meta.source contains the name of the extension that provides this account
    const allAccounts = await web3Accounts();
    // console.log('allAccounts:', allAccounts);
    const personalAddress = allAccounts[0].address;
    console.log('My personal address: ', personalAddress);

    // const code = new CodePromise(api);

    // The address is the actual on-chain address as ss58 or AccountId object.
    const contract = new ContractPromise(
      api,
      metadata,
      '5F8Re8dN4B8eDZqJDmPeLkYaQ14KjK3Bt8qZxQmg5PzYg6Qg'
    );

    // Outputs the correct value.
    console.log(
      'Before:',
      (await contract.query.get(personalAddress, {})).output?.toHuman() // '.toPrimitive()' does the same in this case.
    );
    // await estimateFlipCosts();

    const injector = await web3FromAddress(personalAddress);
    const gasRequired = await estimateFlipCosts();

    await contract.tx
      .flip({
        // storageDepositLimit: Number.MAX_SAFE_INTEGER,
        // gasLimit: Number.MAX_SAFE_INTEGER,
        gasLimit: gasRequired,
      })
      .signAndSend(
        personalAddress,
        { signer: injector.signer },
        async (result) => {
          if (result.status.isInBlock) {
            console.log('in a block');
          } else if (result.status.isFinalized) {
            console.log('finalized');

            console.log(
              'After:',
              (await contract.query.get(personalAddress, {})).output?.toHuman() // '.toPrimitive()' does the same in this case.
            );
          }
        }
      );

    async function estimateCosts() {
      const incValue = 1;
      const options = { storageDepositLimit: null, gasLimit: -1 };

      const { gasRequired, storageDeposit, result } = await contract.query.inc(
        personalAddress,
        options,
        incValue
      );

      console.log(`outcome: ${result.isOk ? 'Ok' : 'Error'}`);
      console.log(`gasRequired ${gasRequired.toString()}`);
    }

    async function estimateFlipCosts() {
      const options = { storageDepositLimit: null, gasLimit: -1 };

      const { gasRequired, storageDeposit, result } = await contract.query.flip(
        personalAddress,
        options
      );

      console.log(`outcome: ${result.isOk ? 'Ok' : 'Error'}`);
      console.log(`gasRequired ${gasRequired.toString()}`);
      console.log(`storageDeposit ${storageDeposit.toString()}`);
      console.log(`result ${result.toString()}`);

      return gasRequired;
    }

    async function queryIncrementerContract() {
      // maximum gas to be consumed for the call. if the limit is too small the call will fail.
      // const gasLimit = 3000n * 1000000n; // BigInt
      const gasLimit = 3000 * 1000000;
      // a limit to how much Balance to be used to pay for the storage created by the contract call
      // if null is passed, unlimited balance can be used
      const storageDepositLimit = null;
      // balance to transfer to the contract account. use only with payable messages, will fail otherwise.
      // formerly know as "endowment"
      const value = api.registry.createType('Balance', 1000);

      // (We perform the send from an account, here using Alice's address)
      const { gasRequired, storageDeposit, result, output } =
        await contract.query.get(allAccounts[0].address, {
          gasLimit,
          storageDepositLimit,
        });

      // The actual result from RPC as `ContractExecResult`
      console.log(result.toHuman());

      // the gas consumed for contract execution
      console.log(gasRequired.toHuman());

      // check if the call was successful
      if (result.isOk) {
        // output the return value
        console.log('Success', output?.toHuman());
      } else {
        console.error('Error', result.asErr);
      }
    }

    // await sendTxToIncrementerContract();

    async function sendTxToIncrementerContract() {
      const value = 10000; // only for payable messages, call will fail otherwise
      const gasLimit = 3000 * 1000000; // removed both n's
      const storageDepositLimit = null;
      const incValue = 1;

      // Send the transaction, like elsewhere this is a normal extrinsic
      // with the same rules as applied in the API (As with the read example,
      // additional params, if required, can follow - here only one is needed)
      await contract.tx
        .inc({ storageDepositLimit, gasLimit }, incValue)
        .signAndSend(personalAddress, (result) => {
          if (result.status.isInBlock) {
            console.log('in a block');
          } else if (result.status.isFinalized) {
            console.log('finalized');
          }
        });
    }

    async function queryERC20() {
      // the address we are going to query
      const target = '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY';
      // the address to subtract the fees from
      const from = allAccounts[0].address;

      // only 1 param needed, the actual address we are querying for (more
      // params can follow at the end, separated by , if needed by the message)
      // const callValue = await contract.query.balanceOf(from, {
      //   gasLimit: -1,
      //   target,
      // });
    }

    async function skip() {
      // the address we use to use for signing, as injected
      const SENDER = '5Cd1vQyC7VupnLyqTY8JLJga7XqjPcQMwmKZbB6WJDqhAwG5';

      // finds an injector fon an address
      const injector = await web3FromAddress(SENDER);
      console.log('injector:', injector);
    }

    async function skipAsWell() {
      // Without the `async` syntax
      /* ApiPromise.create({ provider: wsProvider }).then((api) =>
      console.log('without the async syntax', api.genesisHash.toHex())
    ); */

      // boilerplate
      /* (async function boilerplate() {
      // Create the instance
      const api = new ApiPromise({ provider: wsProvider });

      // Wait until we are ready and connected
      await api.isReady;

      // Do something
      console.log('boilerplate:', api.genesisHash.toHex());
    })(); */

      // Do something
      console.log('Genesis hash:', api.genesisHash.toHex());

      // The length of an epoch (session) in Babe
      console.log(
        'Epoch duration:',
        api.consts.babe // Outputs: undefined
        // (api.consts.babe.epochDuration as any).toNumber()
      );

      // The amount required to create a new account
      console.log(
        'Existential deposit:',
        (api.consts.balances.existentialDeposit as any).toNumber()
      ); // Outputs: 500

      // The amount required per byte on an extrinsic
      console.log(
        'Byte fee:',
        (api.consts.transactionPayment.transactionByteFee as any)?.toNumber() // Outputs: undefined
      );

      // The actual address that we will use
      const ADDR = '5Cd1vQyC7VupnLyqTY8JLJga7XqjPcQMwmKZbB6WJDqhAwG5'; // my personal address

      // // Retrieve the last timestamp
      // const now = await api.query.timestamp.now();

      // // Retrieve the account balance & nonce via the system module
      // const { nonce, data: balance } = (await api.query.system.account(
      //   ADDR
      // )) as any;

      // Retrieve the last block timestamp, account nonce & balances
      const [now, { nonce, data: balance }] = await Promise.all([
        api.query.timestamp.now(),
        api.query.system.account(ADDR) as Promise<any>,
      ]);

      console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`); // 25,000.8492 TZERO = 24968795285714111?

      (async function rpcQueries() {
        // https://polkadot.js.org/docs/api/start/api.rpc

        // Retrieve the chain name
        const chain = await api.rpc.system.chain();

        // Retrieve the latest header
        const lastHeader = await api.rpc.chain.getHeader();

        // Log the information
        console.log(
          `${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}` // Outputs: Aleph Zero Testnet: last block #19543101 has hash 0xccfa6c45c94cb8b345e3178552abf9e96183f69bf50b5f983a95f1e5198fe383
        );

        (async function subscriptions() {
          let count = 0;

          // Subscribe to the new headers
          const unsubHeads = await api.rpc.chain.subscribeNewHeads(
            (lastHeader) => {
              console.log(
                `${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}` // Works as expected.
              );

              if (++count === 1 /* 10 */) {
                unsubHeads();
              }
            }
          );
        })();

        // Continue here: https://polkadot.js.org/docs/api/start/api.query.subs
      })();
    }
  }

  useEffect(() => {
    run();
  }, []);

  return null;
}
