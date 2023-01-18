// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Executor {
    event CallSuccess(uint256 callIndex, bytes returnData);

    event CallFailed(uint256 callIndex, bytes returnData);

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external {
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, bytes memory returnData) = targets[i].call{
                value: values[i]
            }(calldatas[i]);
            if (success) {
                emit CallSuccess(i, returnData);
            } else {
                emit CallFailed(i, returnData);
            }
        }
    }
}
