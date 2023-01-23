// SPDX-License-Identifier: Deez Nuggz
pragma solidity ^0.8.17;

interface IERC721Receiver {
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external returns (bytes4);
}

contract MockReceiver is IERC721Receiver {
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external pure returns (bytes4) {
        return
            bytes4(
                keccak256(
                    abi.encodePacked(
                        "onERC721Received(address,address,uint256,bytes)"
                    )
                )
            );
    }
}
