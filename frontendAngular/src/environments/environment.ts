// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  chainCurrencyName: 'Ether',
  //Number of blocks to do historical searches (like for GameCreated events)
  numberOfBlocksInHistoricSearches: 10000,
  //notebook Dell
  //betTokenAddress: '0xAec06a3112Ce416701a8C0333E502376205073fc',
  //gameFactoryAddress: '0x8F7364cF8A2383e25818552692B7399712eeb8EF',
  //notebook Vaio - Ganache v7
  // betTokenAddress: '0x02a0bE3A9f3B9680361462Fa3275327a16ecA2f4',
  // gameFactoryAddress: '0x754Cf0D53248D078CdF734e3747eefDB1Aae09e0',
  // CalculatorAddress: '0xF3510694bbbBaB4FB4C412FDe127EAF2eAC4F37f',
  //GANACHE 2.5.4
  // betTokenAddress: '0x85e855b22F01BdD33eE194490c7eB16b7EdaC019',
  // gameFactoryAddress: '0x06D0020790D42df662bB04Ab01f0208Cfbbb956F',
  // HARDHAT COM GANACHE
  betTokenAddress: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
  calculatorAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
  gameFactoryAddress: '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
