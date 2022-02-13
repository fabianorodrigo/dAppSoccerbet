import BN from 'bn.js';

export interface BetTokenMintedEvent {
  bettor: string;
  quantity: BN;
  betTokenBalance: BN;
}
