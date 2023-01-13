pragma solidity ^0.8.17;

contract GuessNumber {
    uint256 private secretNumber;
    uint256 public minimumWager;
    address public dealer;
    mapping(uint256 => address) public guesses;

    // secret number must be between 1 and 10
    modifier isValidSecret(uint256 _secret) {
        require(_secret >= 1 && _secret <= 10);
        _;
    }

    // contract is deployed with a secret number
    constructor(uint256 _secretNumber, uint256 _minimumWager)
        isValidSecret(_secretNumber)
    {
        dealer = msg.sender;
        secretNumber = _secretNumber;
        minimumWager = _minimumWager;
    }

    // submit a number guess alongside value
    function submitGuess(uint256 _guess) external payable {
        require(msg.value >= minimumWager, "Insufficient wager for guess");

        // check for duplicates
        address guesser = guesses[_guess];

        require(guesser != address(0), "Guess has already been taken");

        // save guess as sender address, unique guess needed
        guesses[_guess] = msg.sender;
    }

    // settle the bet
    function settleBet() external {
        address winner = guesses[secretNumber];

        // no winner, wager sent to dealer
        if (winner == address(0)) {
            (bool sent, ) = dealer.call{value: address(this).balance}("");
            require(sent, "Failed to send Ether to winner");
        }
        // wager sent to winner
        else {
            (bool sent, ) = winner.call{value: address(this).balance}("");
            require(sent, "Failed to send Ether to dealer");
        }
    }

    receive() external payable {}
}
