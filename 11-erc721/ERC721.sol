// SPDX-License-Identifier: Deez Nuggz
pragma solidity ^0.8.17;

interface IERC721 {
    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 indexed _tokenId
    );

    event Approval(
        address indexed _owner,
        address indexed _operator,
        uint256 indexed _tokenId
    );

    event ApprovalForAll(
        address indexed _owner,
        address indexed _operator,
        bool _approved
    );

    function balanceOf(address _owner) external view returns (uint256);

    function ownerOf(uint256 _tokenId) external view returns (address);

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata data
    ) external;

    function approve(address _operator, uint256 _tokenId) external;

    function setApprovalForAll(address _operator, bool _approved) external;

    function getApproved(uint256 _tokenId)
        external
        view
        returns (address _operator);

    function isApprovedForAll(address _owner, address _operator)
        external
        view
        returns (bool _approved);
}

interface IERC721Receiver {
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external returns (bytes4);
}

contract ERC721 is IERC721 {
    mapping(address => uint256) balances;
    mapping(uint256 => address) ownerships;
    mapping(uint256 => address) approvals;
    mapping(address => mapping(address => bool)) operators;

    // mints first N tokens to the deployer
    constructor(uint256 initialSupply) {
        balances[msg.sender] = initialSupply;
        for (uint256 i = 1; i <= initialSupply; i++) {
            ownerships[i] = msg.sender;
        }
    }

    function balanceOf(address _owner) external view returns (uint256) {
        return balances[_owner];
    }

    function ownerOf(uint256 _tokenId) external view returns (address) {
        return ownerships[_tokenId];
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        require(
            msg.sender == _from ||
                msg.sender == approvals[_tokenId] ||
                operators[_from][msg.sender],
            "Unauthorized sender"
        );

        approvals[_tokenId] = address(0);

        balances[_from] -= 1;
        balances[_to] += 1;
        ownerships[_tokenId] = _to;

        emit Transfer(_from, _to, _tokenId);
    }

    // what the fuck does the require statement look like?
    // how does it handle non-onERC721Receive confirming contracts?
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        if (_to.code.length > 0) {
            try
                IERC721Receiver(_to).onERC721Received(
                    msg.sender,
                    _from,
                    _tokenId,
                    ""
                )
            returns (bytes4 returnValue) {
                if (
                    returnValue ==
                    bytes4(
                        keccak256(
                            abi.encodePacked(
                                "onERC721Received(address,address,uint256,bytes)"
                            )
                        )
                    )
                ) {
                    require(
                        msg.sender == _from ||
                            msg.sender == approvals[_tokenId] ||
                            operators[_from][msg.sender],
                        "Unauthorized sender"
                    );

                    approvals[_tokenId] = address(0);

                    balances[_from] -= 1;
                    balances[_to] += 1;
                    ownerships[_tokenId] = _to;

                    emit Transfer(_from, _to, _tokenId);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("Recipient address does not handle ERC721 tokens");
                } else {
                    revert("Custom reason returned");
                }
            }
        } else {
            require(
                msg.sender == _from ||
                    msg.sender == approvals[_tokenId] ||
                    operators[_from][msg.sender],
                "Unauthorized sender"
            );

            approvals[_tokenId] = address(0);

            balances[_from] -= 1;
            balances[_to] += 1;
            ownerships[_tokenId] = _to;

            emit Transfer(_from, _to, _tokenId);
        }
    }

    // what the fuck does the require statement look like?
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata data
    ) external {
        if (_to.code.length > 0) {
            try
                IERC721Receiver(_to).onERC721Received(
                    msg.sender,
                    _from,
                    _tokenId,
                    data
                )
            returns (bytes4 returnValue) {
                if (
                    returnValue ==
                    bytes4(
                        keccak256(
                            abi.encodePacked(
                                "onERC721Received(address,address,uint256,bytes)"
                            )
                        )
                    )
                ) {
                    require(
                        msg.sender == _from ||
                            msg.sender == approvals[_tokenId] ||
                            operators[_from][msg.sender],
                        "Unauthorized sender"
                    );

                    approvals[_tokenId] = address(0);

                    balances[_from] -= 1;
                    balances[_to] += 1;
                    ownerships[_tokenId] = _to;

                    emit Transfer(_from, _to, _tokenId);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("Recipient address does not handle ERC721 tokens");
                } else {
                    revert("Custom reason returned");
                }
            }
        } else {
            require(
                msg.sender == _from ||
                    msg.sender == approvals[_tokenId] ||
                    operators[_from][msg.sender],
                "Unauthorized sender"
            );

            approvals[_tokenId] = address(0);

            balances[_from] -= 1;
            balances[_to] += 1;
            ownerships[_tokenId] = _to;

            emit Transfer(_from, _to, _tokenId);
        }
    }

    function approve(address _operator, uint256 _tokenId) external {
        require(msg.sender == ownerships[_tokenId], "Unauthorized approver");

        approvals[_tokenId] = _operator;
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        operators[msg.sender][_operator] = _approved;

        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function getApproved(uint256 _tokenId)
        external
        view
        returns (address _operator)
    {
        return approvals[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator)
        external
        view
        returns (bool _approved)
    {
        return operators[_owner][_operator];
    }
}
