abstract contract OnlyDelegateCall {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable state-variable-assignment
    address private immutable __self = address(this);

    function checkDelegateCall() private view {
        require(
            address(this) != __self,
            "Function must be called through delegatecall"
        );
    }

    modifier onlyDelegateCall() {
        checkDelegateCall();
        _;
    }
}
