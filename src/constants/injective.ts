import { Network } from '@injectivelabs/networks';

export const NETWORK = Network.Mainnet as Network;

export const DOJOSWAP_CONTRACT =
  NETWORK == Network.Mainnet
    ? 'inj1578zx2zmp46l554zlw5jqq3nslth6ss04dv0ee'
    : 'inj1dw8324k4sv4uwqjz730clzdd6ac975pu7gp3rd';
export const DOJOSWAP_FACTORY =
  NETWORK == Network.Mainnet
    ? 'inj1pc2vxcmnyzawnwkf03n2ggvt997avtuwagqngk'
    : 'inj14mxpetzg9sur0g6m39zu9m9n2ajxvlx4ytlgq3';
export const DOJOSWAP_SWAP_API_URL =
  'https://api.dojo.trading/dojoswap/tx/swap';

export const MITOSWAP_CONTRACT = 'inj1j5mr2hmv7y2z7trazganj75u8km8jvdfuxncsp';
