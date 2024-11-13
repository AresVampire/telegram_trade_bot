export const factoryABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'getPair',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export const uniswapABI = [
  {
    inputs: [],
    name: 'factory',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export const pairABI = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      {
        internalType: 'uint112',
        name: '_reserve0',
        type: 'uint112',
      },
      {
        internalType: 'uint112',
        name: '_reserve1',
        type: 'uint112',
      },
      {
        internalType: 'uint32',
        name: '_blockTimestampLast',
        type: 'uint32',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export const swapContractABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amountToken',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amountETH',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256',
      },
    ],
    name: 'AddLiquidityETH',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: '_caller',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_admin',
        type: 'address',
      },
    ],
    name: 'OnlyAdmin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'swapProtocol',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amountEthDesired',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountTokenDesired',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountTokenMin',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountETHMin',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'addLiquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountToken',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountETH',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'wtoken',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'swap',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'slippage',
        type: 'uint256',
      },
    ],
    name: 'buyToken',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'deadline',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'wtoken',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'swap',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'factoryAddr',
        type: 'address',
      },
    ],
    name: 'estimateBuyResult',
    outputs: [
      {
        internalType: 'uint256',
        name: 'output',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'wtoken',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'swap',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'factoryAddr',
        type: 'address',
      },
    ],
    name: 'estimateSellResult',
    outputs: [
      {
        internalType: 'uint256',
        name: 'output',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'wtoken',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'swap',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'slippage',
        type: 'uint256',
      },
    ],
    name: 'sellToken',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_fee',
        type: 'uint256',
      },
    ],
    name: 'setFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        internalType: 'address payable',
        name: '_receiver',
        type: 'address',
      },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
