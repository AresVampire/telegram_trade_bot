import { Chain } from '@prisma/client';
import {
  Contract,
  ethers,
  Wallet as EthersWallet,
  formatEther,
  formatUnits,
  parseUnits,
  Provider,
} from 'ethers';
import { Address, erc20Abi, isAddressEqual } from 'viem';

import { Position, Wallet } from '~/bot/types';
import { config } from '~/config';
import {
  factoryABI,
  pairABI,
  swapContractABI,
  uniswapABI,
} from '~/constants/abi';
import { calculatePNL, getPositions } from '~/services/transaction.service';

import { getPriorityValue } from '../get-priority-value';
import {
  isMethodExistProxy,
  swapContractAddr,
  swapProtocolAddr,
  wethAddr,
} from './helper';

const erc20Interface = new ethers.Interface(erc20Abi);
const swapInterface = new ethers.Interface(swapContractABI);

export class EthereumWallet implements Wallet {
  ethersProvider: Provider;

  constructor() {
    this.ethersProvider = new ethers.JsonRpcProvider(config.ETHEREUM_NODE_URL);
  }

  chain = () => Chain.ETHEREUM;

  explorerURL = () => 'https://etherscan.io/';

  nativeCurrency = () => 'ETH';

  createWallet = async () => {
    const wallet = EthersWallet.createRandom();
    return wallet;
  };

  importWallet = async (privateKey: string) => {
    const wallet = new EthersWallet(privateKey, this.ethersProvider);

    return wallet;
  };

  getBalance = async (address: string) => {
    const balanceAmount = await this.ethersProvider.getBalance(address);

    return formatEther(balanceAmount);
  };

  getTokenName = async (address: string) => {
    try {
      const tokenContract = new Contract(
        address,
        erc20Abi,
        this.ethersProvider
      );

      const tokenName: string = await tokenContract.name();
      return tokenName;
    } catch (e) {
      // FIXME: Refactor
      console.error({
        message: 'getTokenName failed',
        err: e,
      });
      return 'error';
    }
  };

  getTokenSymbol = async (address: string) => {
    try {
      const tokenContract = new Contract(
        address,
        erc20Abi,
        this.ethersProvider
      );

      const tokenSymbol = await tokenContract.symbol();
      return tokenSymbol;
    } catch (e) {
      // FIXME: Refactor
      console.error({
        message: 'getTokenSymbol failed',
        err: e,
      });
      return 'error';
    }
  };

  getGasPriceProvider = async (toAddress: string, amountETH: string) => {
    const amountWei = ethers.parseEther(amountETH);
    const { gasPrice } = await this.ethersProvider.getFeeData();

    // Get the gas limit
    const gasLimit = await this.ethersProvider.estimateGas({
      to: toAddress,
      value: amountWei,
    });

    return ethers.formatEther(
      (BigInt(gasPrice!) * BigInt(gasLimit)).toString()
    );
  };

  withdraw = async (
    mainWalletPrivateKey: string,
    toAddress: string,
    amountETH: string,
    priority: number
  ) => {
    const wallet = new ethers.Wallet(mainWalletPrivateKey, this.ethersProvider);
    const amountWei = BigInt(Math.floor(parseFloat(amountETH) * 1e18));
    const gasPrice = await getPriorityValue(priority, this.ethersProvider);

    // Get the gas limit
    const gasLimit = await wallet.estimateGas({
      to: toAddress,
      value: amountWei,
    });

    // Calculate the value to send (userBalance - gasPrice * gasLimit)
    const gasFee = BigInt(gasPrice) * BigInt(gasLimit);

    const valueToSend = BigInt(amountWei) - BigInt(gasFee);

    const txReceipt = await wallet.sendTransaction({
      to: toAddress,
      gasPrice,
      gasLimit,
      value: valueToSend,
    });

    const confirmedTx = await txReceipt.wait();

    return confirmedTx?.hash;
  };

  getTokenPrice = async (tokenAddr: string) => {
    try {
      const uniswapContract = new Contract(
        swapProtocolAddr[0],
        uniswapABI,
        this.ethersProvider
      );
      const factoryAddr = await uniswapContract.factory();

      const factoryContract = new Contract(
        factoryAddr,
        factoryABI,
        this.ethersProvider
      );
      const pairAddr = await factoryContract.getPair(tokenAddr, wethAddr[0]);

      const pairContract = new Contract(pairAddr, pairABI, this.ethersProvider);

      const { _reserve0, _reserve1 } = await pairContract.getReserves();

      const token0Addr: string = await pairContract.token0();
      const tokenAmt: string = isAddressEqual(
        token0Addr as `0x${string}`,
        wethAddr[0] as `0x${string}`
      )
        ? _reserve1
        : _reserve0;
      const ETHAmt: string = isAddressEqual(
        token0Addr as `0x${string}`,
        wethAddr[0] as `0x${string}`
      )
        ? _reserve0
        : _reserve1;

      const price = String(
        (Number(ETHAmt) * 1000000) / Number(tokenAmt) / 1000000
      );

      return price;
    } catch (error) {
      // FIXME: Refactor
      console.error(error);
      return 'error';
    }
  };

  calcGasTokensBuy = async (
    user: string,
    amount: string,
    address: string,
    slippage: string
  ) => {
    try {
      const usdtContract = new Contract(
        wethAddr[0],
        erc20Abi,
        this.ethersProvider
      );

      const decimals = await usdtContract.decimals();

      const approveTxData = erc20Interface.encodeFunctionData('approve', [
        swapContractAddr[0],
        parseUnits(amount, decimals),
      ]);

      const approveTxObj = {
        from: user,
        to: wethAddr[0],
        data: approveTxData,
      };
      const approveGas = await this.ethersProvider.estimateGas(approveTxObj);

      const buyTxData = swapInterface.encodeFunctionData('buyToken', [
        wethAddr[0],
        swapProtocolAddr[0],
        address,
        parseUnits(amount, decimals),
        Number(slippage),
      ]);

      const buyTxObj = {
        from: user,
        to: swapContractAddr[0],
        data: buyTxData,
        value: parseUnits(amount, decimals),
      };

      const buyGas = await this.ethersProvider.estimateGas(buyTxObj);

      const total =
        ((BigInt(approveGas) + BigInt(buyGas)) * BigInt(11)) / BigInt(10);
      return String(`${total} wei`);
    } catch (e) {
      // FIXME: Refactor
      console.error({
        message: 'calcGasTokensBuy failed',
        err: e,
      });
      return 'error';
    }
  };

  buyTokens = async (
    user: string,
    privateKey: string,
    amount: string,
    address: string,
    slippage: string,
    priority: number
  ) => {
    try {
      const signer = new ethers.Wallet(privateKey, this.ethersProvider);
      const gasPrice = await getPriorityValue(priority, this.ethersProvider);

      const approveTxData = erc20Interface.encodeFunctionData('approve', [
        swapContractAddr[0],
        BigInt(Number(amount) * 1e18),
      ]);

      const approveTxObj = {
        from: user,
        to: wethAddr[0],
        data: approveTxData,
      };

      const approveTx = await signer.sendTransaction({
        ...approveTxObj,
        gasPrice,
      });
      await approveTx.wait();

      const buyTxData = swapInterface.encodeFunctionData('buyToken', [
        wethAddr[0],
        swapProtocolAddr[0],
        address,
        BigInt(Number(amount) * 1e18),
        Number(slippage),
      ]);

      const buyTxObj = {
        from: user,
        to: swapContractAddr[0],
        data: buyTxData,
        value: BigInt(Number(amount) * 1e18),
      };

      const buyTx = await signer.sendTransaction({
        ...buyTxObj,
        gasPrice,
      });
      const tx = await buyTx.wait();

      return tx?.hash;
    } catch (e) {
      // FIXME: Refactor
      console.error({
        message: 'buyTokens failed',
        err: e,
      });
      return 'error';
    }
  };

  getValue = async (userAddress: string, address: string) => {
    const tokenContract = new Contract(address, erc20Abi, this.ethersProvider);
    const value = await tokenContract.balanceOf(userAddress);
    return value;
  };

  getDecimals = async (address: string) => {
    const tokenContract = new Contract(address, erc20Abi, this.ethersProvider);
    const value = await tokenContract.decimals();
    return value;
  };

  isValidContract = async (tokenAddress: string) => {
    try {
      const bytecode = await this.ethersProvider.getCode(tokenAddress);

      if (bytecode === '0x') {
        return false;
      }

      const decimalsExists = await isMethodExistProxy(
        Chain.ETHEREUM,
        tokenAddress as Address,
        erc20Abi,
        'decimals'
      );

      const totalSupplyExists = await isMethodExistProxy(
        Chain.ETHEREUM,
        tokenAddress as Address,
        erc20Abi,
        'totalSupply'
      );

      const symbolExists = await isMethodExistProxy(
        Chain.ETHEREUM,
        tokenAddress as Address,
        erc20Abi,
        'symbol'
      );

      return decimalsExists && totalSupplyExists && symbolExists;
    } catch (error) {
      // FIXME: Refactor
      console.error('contract validation error', error);
      return false;
    }
  };

  getPositionTokenAddresses = async (user: string, minPosValue: number) => {
    let result = await getPositions(user, Chain.ETHEREUM);
    const positionArray: Pick<Position, 'id' | 'address'>[] = [];
    while (result && result.length > 0) {
      const address = result[0].destination;
      const tokenPriceInEth = await this.getTokenPrice(address);
      if (Number(tokenPriceInEth) < Number(minPosValue)) {
        result = result.filter(
          (item) =>
            !isAddressEqual(
              item.destination as `0x${string}`,
              address as `0x${string}`
            )
        );
        // eslint-disable-next-line no-continue
        // continue
      } else {
        positionArray.push({
          id: result[0].txnId,
          address,
        });
        result = result.filter(
          (item) =>
            !isAddressEqual(
              item.destination as `0x${string}`,
              address as `0x${string}`
            )
        );
      }
    }
    return positionArray;
  };

  getPosition = async (user: string, minPosValue: number) => {
    let result = await getPositions(user, Chain.ETHEREUM);
    const positionArray: Position[] = [];
    while (result && result.length > 0) {
      const address = result[0].destination;
      const tokenPriceInEth = await this.getTokenPrice(address);
      if (Number(tokenPriceInEth) < Number(minPosValue)) {
        result = result.filter((item) => item.destination !== address);
        // eslint-disable-next-line no-continue
        continue;
      }
      const tokenName = await this.getTokenName(address);
      const tokenSymbol = await this.getTokenSymbol(address);
      const profitValue = await calculatePNL(address, user, Chain.ETHEREUM);
      const profit = `${profitValue}ETH`;
      const decimals = await this.getDecimals(address);
      const tokenPrice = await this.getValue(user, address);
      const mcap = await this.calcMarketCap(address);
      positionArray.push({
        id: result[0].txnId,
        address,
        value: formatUnits(String(tokenPrice), decimals),
        tokenName,
        tokenSymbol,
        profit,
        mcap: String(mcap),
        tokenPrice: tokenPriceInEth,
      });
      result = result.filter((item) => item.destination !== address);
    }
    return positionArray;
  };

  getSellList = async (user: string, address: string) => {
    const tokenName = await this.getTokenName(address);
    const tokenSymbol = await this.getTokenSymbol(address);
    const profit = `${await calculatePNL(address, user, Chain.ETHEREUM)} ETH`;

    const amount = await this.getTokenPrice(address);
    const value = String(amount);

    const profitValue = await calculatePNL(address, user, Chain.ETHEREUM);

    const mcap = await this.calcMarketCap(address);

    const netProfit = `${profitValue} ETH`;

    const chain = this.chain();

    const balance = await this.getValue(user, address);
    const decimals = await this.getDecimals(address);

    const walletAmount = await this.getBalance(user);

    const nativeCurrency = this.nativeCurrency();

    return {
      tokenSymbol,
      tokenName,
      address,
      profit,
      value,
      mcap,
      timeProfit: '',
      netProfit,
      initial: '',
      chain,
      balance: formatUnits(balance, decimals),
      walletBalance: walletAmount,
      nativeCurrency,
    };
  };

  calcMarketCap = async (address: string) => {
    try {
      const tokenContract = new Contract(
        address,
        erc20Abi,
        this.ethersProvider
      );
      const totalSupply = await tokenContract.totalSupply();
      const parsedSupply = formatEther(String(totalSupply));

      const tokenPrice = await this.getTokenPrice(address);

      return Number(tokenPrice) * Number(parsedSupply);
    } catch (e) {
      // FIXME: Refactor
      console.error({
        message: 'calcMarketCap failed',
        err: e,
      });
      return 'error';
    }
  };

  calcGasTokenSell = async (
    user: string,
    amount: string,
    address: string,
    pKey: string,
    slippage: string
  ) => {
    try {
      const signer = new EthersWallet(pKey, this.ethersProvider);

      const tokenContract = new Contract(address, erc20Abi, signer);
      const decimals = await tokenContract.decimals();

      const swapContract = new Contract(
        swapContractAddr[0],
        swapContractABI,
        signer
      );

      const allowance = await tokenContract.allowance(
        user,
        swapContractAddr[0]
      );

      if (allowance < parseUnits(amount, decimals)) {
        const approveTx = await tokenContract.approve(
          swapContractAddr[0],
          ethers.MaxUint256
        );
        await approveTx.wait();

        const callData = swapContract.interface.encodeFunctionData(
          'sellToken',
          [
            wethAddr[0],
            swapProtocolAddr[0],
            address,
            parseUnits(amount, decimals),
            Number(slippage),
          ]
        );
        const estimatedSellTokenGas = await this.ethersProvider.estimateGas({
          from: user,
          to: swapContractAddr[0],
          data: callData,
        });

        const total =
          ((BigInt(approveTx.gasLimit) + BigInt(estimatedSellTokenGas)) *
            BigInt(11)) /
          BigInt(10);
        return String(`${total} wei`);
      }

      const callData = swapContract.interface.encodeFunctionData('sellToken', [
        wethAddr[0],
        swapProtocolAddr[0],
        address,
        parseUnits(amount, decimals),
        Number(slippage),
      ]);
      const estimatedSellTokenGas = await this.ethersProvider.estimateGas({
        from: user,
        to: swapContractAddr[0],
        data: callData,
      });

      const total = (BigInt(estimatedSellTokenGas) * BigInt(11)) / BigInt(10);
      return String(`${total} wei`);
    } catch (e) {
      // FIXME: Refactor
      console.error({
        message: 'calcGasTokenSell failed',
        err: e,
      });
      return 'error';
    }
  };

  sellTokens = async (
    user: string,
    privateKey: string,
    amount: string,
    address: string,
    slippage: string,
    priority: number
  ) => {
    try {
      const gasPrice = await getPriorityValue(priority, this.ethersProvider);

      const signer = new EthersWallet(privateKey, this.ethersProvider);

      const tokenContract = new Contract(address, erc20Abi, signer);
      const decimals = await tokenContract.decimals();

      const swapContract = new Contract(
        swapContractAddr[0],
        swapContractABI,
        signer
      );
      const allowance = await tokenContract.allowance(
        user,
        swapContractAddr[0]
      );

      if (allowance < parseUnits(amount, decimals)) {
        const approveTx = await tokenContract.approve(
          swapContractAddr[0],
          ethers.MaxUint256
        );
        await approveTx.wait();

        const sellTokenTx = await swapContract.sellToken(
          wethAddr[0],
          swapProtocolAddr[0],
          address,
          parseUnits(amount, decimals),
          Number(slippage),
          { gasPrice }
        );

        return sellTokenTx.hash;
      }

      const sellTokenTx = await swapContract.sellToken(
        wethAddr[0],
        swapProtocolAddr[0],
        address,
        parseUnits(amount, decimals),
        Number(slippage),
        { gasPrice }
      );

      return sellTokenTx.hash;
    } catch (e) {
      // FIXME: Refactor
      console.error({
        message: 'sell error',
        err: e,
      });
      return 'error';
    }
  };

  estimateBuy = async (amount: string, token: string) => {
    const swapContract = new Contract(
      swapContractAddr[0],
      swapContractABI,
      this.ethersProvider
    );

    const uniswap = new Contract(
      swapProtocolAddr[0],
      uniswapABI,
      this.ethersProvider
    );

    const factoryAddr = await uniswap.factory();
    const output = await swapContract.estimateBuyResult(
      wethAddr[0],
      swapProtocolAddr[0],
      token,
      BigInt(Number(amount) * 1e18),
      factoryAddr
    );

    return { amount: Number(output) / 1e18 };
  };

  estimateSell = async (amount: string, token: string) => {
    const swapContract = new Contract(
      swapContractAddr[0],
      swapContractABI,
      this.ethersProvider
    );

    const uniswap = new Contract(
      swapProtocolAddr[0],
      uniswapABI,
      this.ethersProvider
    );

    const factoryAddr = await uniswap.factory();
    const output = await swapContract.estimateSellResult(
      wethAddr[0],
      swapProtocolAddr[0],
      token,
      amount,
      factoryAddr
    );

    return { amount: Number(output) / 1e18 };
  };
}
