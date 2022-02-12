import BN from 'bn.js';

export interface BetTokenMintedEvent {
  bettor: string;
  value: BN;
  betTokenBalance: BN;
}
