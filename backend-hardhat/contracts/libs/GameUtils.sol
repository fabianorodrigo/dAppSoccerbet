// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../structs/Bet.sol";

library GameUtils {
    /**
     * @notice Count how many bets in {_bets} matched the {finalScore}
     *
     * @param _bets The scope of bets analysed (expected all the bets on a game)
     * @param _finalScore The real final score at the end of the game
     *
     * @return _winners The quantity of bets in {_bets} that matched the {finalScore}
     */
    function countWinners(Bet[] memory _bets, Score memory _finalScore)
        public
        pure
        returns (uint256)
    {
        uint256 _result = 0;
        for (
            uint256 _idWinners_i = 0;
            _idWinners_i < _bets.length;
            _idWinners_i++
        ) {
            if (
                _bets[_idWinners_i].score.home == _finalScore.home &&
                _bets[_idWinners_i].score.visitor == _finalScore.visitor
            ) {
                _result++;
            }
        }
        return _result;
    }

    /**
     * @notice Identify which bets matched the finalScore and updates: _bets[i].result,
     * _totalTokensBetWinners,
     *
     * @param _bets The scope of bets analysed (expected all the bets on a game)
     * @param _finalScore The real final score at the end of the game
     *
     * @return TRUE if the process of identifying winners is completed (loop for all _bets)
     */
    function identifyWinners(Bet[] memory _bets, Score memory _finalScore)
        external
        pure
        returns (uint256[] memory)
    {
        uint256 _winner_i = 0;
        uint256[] memory _winners = new uint256[](
            countWinners(_bets, _finalScore)
        );
        // Each interaction of this loops is spending around 30K gas
        // The loop continues until the end or the gasleft() > 30K
        for (
            uint256 _idWinners_i = 0;
            _idWinners_i < _bets.length;
            _idWinners_i++
        ) {
            if (
                _bets[_idWinners_i].score.home == _finalScore.home &&
                _bets[_idWinners_i].score.visitor == _finalScore.visitor
            ) {
                _winners[_winner_i] = _idWinners_i;
                _winner_i++;
            }
        }
        return _winners;
    }
}
