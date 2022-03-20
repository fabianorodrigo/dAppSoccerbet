import BN from 'bn.js';

export interface BetTokenMintedEvent {
  tokenBuyer: string;
  quantity: BN;
  contractBalance: BN;
}
