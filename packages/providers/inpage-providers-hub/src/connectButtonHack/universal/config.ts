import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import { replaceIcon } from './imgUtils';
import { findIconAndNameInShadowRoot } from './shadowRoot';
import { FindResultType, Selector } from './type';
import { getConnectWalletModalByTitle, getWalletListByBtn } from './utils';
import { findIconAndNameDirectly } from './findIconAndName';

export const basicWalletInfo = {
  metamask: {
    updatedIcon: WALLET_CONNECT_INFO.metamask.icon,
    updatedName: WALLET_CONNECT_INFO.metamask.text,
    name: /^meta\s*mask$/i,
  },
  walletconnect: {
    updatedIcon: WALLET_CONNECT_INFO.walletconnect.icon,
    updatedName: WALLET_CONNECT_INFO.walletconnect.text,
    name: /^wallet\s*connect$/i,
  },
  suiwallet: {
    updatedIcon: WALLET_CONNECT_INFO.suiwallet.icon,
    updatedName: WALLET_CONNECT_INFO.suiwallet.text,
    name: /^(sui|Sui\s?Wallet)$/i,
  },
  phantom: {
    updatedIcon: WALLET_CONNECT_INFO.phantom.icon,
    updatedName: WALLET_CONNECT_INFO.phantom.text,
    name: /^phantom$/i,
  },
} as const;

/**
 *  used to the following conditions:
 *    - wallet icon and name both exists
 *    - only one icon and only one name element
 * 
 * wallet icon and name locate strategy:
 *  step1: if icon and name elements have uniq and stable class name ,
 *     - then use function `findIconAndName()` to return them directly
 *  step2: else use `container` to locate the name and icon automatically
 */

export type WalletInfo = {
  updatedIcon: string;
  updatedName: string;
  /**
   * it's better to  match the start and the end character at the same time
   */
  name: RegExp;

  /**
   * 1. the common ancestor selector of wallet icon and name element
   * 2. get the container element by document.querySelector(not document.querySelectorAll)
   * 3. tradeoff
   *    3.1. if the selector is ID selector(or any unique and stable selector,like '.connect-wallet-modal')
   *      - The closer the selector is to the wallet button, the more likely to get element.
   *          - because only one element will be choosen
   *      - but the closer the selector is to the wallet button, the more difficult to maintain .
   *      - there is no difference between the accuracy that mean it will not choose the wrong element.
   *          - because only one element will be choosen
   *    3.2. if the selector is not a unique or stable selector, like '.modal'
   *      - The farther away from the wallet button, the more likely to get the wrong element.
   *          - beacuase '.modal' will choose other modal elements which are not connect wallet modal
   * 4. choose strategy :
   *    step1. choose the wallet button by unique and stable selector(id selector,uniq class etc) if possible
   *    step2. choose the wallet button list container by unique and stable selector(id selector,uniq class etc) if possible
   *    step3. choose the connect wallet modal by title [getConnectWalletModalByTitle()]
   * 5. the container must be a selector or a function for it should be called when mutation happens
   */
  container?: Selector | (() => HTMLElement | null);


  /**
   *  custom method used when
   *  1. icon and name have a uniq selector(id selector,uniq class etc)
   *  2. other special cases,like shadowRoot
   * **/
  findIconAndName?: (wallet: WalletInfo) => FindResultType | undefined;

  updateIcon?: (img: HTMLElement, iconStr: string) => HTMLImageElement;
  updateName?: (textNode: Text, text: string) => void;
};

export type SitesInfo = {
  urls: string[];
  walletsForProvider: {
    [k in IInjectedProviderNames]?: WalletInfo[];
  };
};

export const sitesConfig: SitesInfo[] = [
  {
    urls: ['app.turbos.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          container: "div[role='dialog'] .rc-dialog-body > ul",
        },
      ],
    },
  },
  {
    urls: ['app.defisaver.com'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.button-option.MetaMask > svg',
              '.button-option.MetaMask .connect-wallet-button-name',
              name,
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.button-option.WalletConnect > svg',
              '.button-option.WalletConnect .connect-wallet-button-name',
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['haedal.xyz'],
    walletsForProvider: {
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          container: "div[role='dialog'] .wkit-select__container",
        },
      ],
    },
  },

  {
    urls: ['trade.bluefin.io'],
    walletsForProvider: {
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          name: /^Connect Sui Wallet$/,
          container: () => getWalletListByBtn("div[role='dialog'] [data-testid='connect-wallet']"),
          updateIcon: (originnalNode: HTMLElement, iconSrc: string) => {
            const img = replaceIcon(originnalNode, iconSrc);
            img.style.marginRight = '12px';
            return img;
          },
        },
      ],
    },
  },
  {
    urls: ['omnilending.omnibtc.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: "div[role='dialog'] .ant-modal-content .wallets-inner",
        },
      ],
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          container: "div[role='dialog'] [class*='WalletListWrapper']",
        },
      ],
    },
  },
  {
    urls: ['app.venus.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div.MuiModal-root .venus-modal', 'Connect a wallet'),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () =>
            getConnectWalletModalByTitle('div.MuiModal-root .venus-modal', 'Connect a wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.uncx.network'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getWalletListByBtn("div[role='dialog'] .v-card .c-list"),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getWalletListByBtn("div[role='dialog'] .v-card .c-list"),
        },
      ],
    },
  },
  {
    urls: ['app.benqi.fi'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#metamask',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '#wallet-connect',
        },
      ],
    },
  },
  {
    urls: ['manta.layerbank.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div.MuiModal-root', 'Connect Wallet'),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getConnectWalletModalByTitle('div.MuiModal-root', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.orbitlending.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['app.stakewise.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '[data-testid="metaMask-connector-button"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '[data-testid="walletConnect-connector-button"]',
        },
      ],
    },
  },
  {
    urls: ['aerodrome.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['walletconnect'],
          container: '.bg-connect button[type="button"]:nth-child(2)',
        },
      ],
    },
  },
  {
    urls: ['lista.org'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'div.MuiModal-root[role="presentation"] [class*="walletGroup"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'div.MuiModal-root[role="presentation"] [class*="walletGroup"] ',
        },
      ],
    },
  },

  //shadow root
  {
    urls: ['app.prismafinance.com'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '.modal .outer-container div.wallets-container ',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '.modal .outer-container div.wallets-container ',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
        },
      ],
    },
  },
  {
    urls: ['vvs.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#wallet-connect-metamask',
        },
      ],
    },
  },
  {
    urls: ['raydium.io'],
    walletsForProvider: {
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: '.Dialog .Card .grid.grid-cols-2',
        },
      ],
    },
  },
  {
    urls: ['01.xyz'],
    walletsForProvider: {
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: () => getConnectWalletModalByTitle('div.fixed', 'Select Wallet'),
        },
      ],
    },
  },
  {
    urls: ['francium.io'],
    walletsForProvider: {
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: '.wallet-modal .connect-wallet-list',
        },
      ],
    },
  },
  
  {
    urls: ['defi.instadapp.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#WEB3_CONNECT_MODAL_ID .web3modal-modal-card',
        },
        {
          ...basicWalletInfo['walletconnect'],
          name: /^WalletConnect v2$/,
          container: '#WEB3_CONNECT_MODAL_ID .web3modal-modal-card',
        },
      ],
      
    },
  },
];
