import BN from 'bn.js';

export interface BetTokenApproval {
  owner: string;
  spender: string;
  value: BN;
}
