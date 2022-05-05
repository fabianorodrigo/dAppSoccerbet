// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  chainCurrencyName: 'Ether',
  //Number of blocks to do historical searches (like for GameCreated events)
  numberOfBlocksInHistoricSearches: 10000,
  //HARDHAT NODE
  betTokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  calculatorAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  gameFactoryAddress: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  // GANACHE
  // betTokenAddress: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
  // calculatorAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
  // gameFactoryAddress: '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
