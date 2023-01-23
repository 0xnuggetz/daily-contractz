pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Certificate is ERC721 {
    uint256 public tokenId;

    constructor() ERC721("Contribution Certificate", "CONCERT") {}

    function mint(address _to) external {
        _safeMint(_to, tokenId);
    }
}

contract Contribution {
    mapping(address => uint256) public contributions;
    Certificate public certificate;
    uint256 public tokenId;

    constructor(address _certificate) {
        certificate = Certificate(_certificate);
    }

    function contribute() public payable {
        require(msg.value > 0, "Not enough Ether sent");

        contributions[msg.sender] = msg.value;

        certificate.mint(msg.sender);
    }
}
