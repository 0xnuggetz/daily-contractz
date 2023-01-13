# Guess Number

I've like to write a simple contract that holds a secret number. The number can be between 1 to 10, let's say.

Then, people can come guess the number with a bet they send along with their guess. Alice sends 0.01 ETH with her guess 5, for instance.

After a certain number of guesses have been fulfilled, one person can "settle the bet" which will see if anyone guessed the number correctly and send all balance to the winner.

Why this didn't work: constructor arguments are visible on-chain, hence they should not be used to set private information

### Scenario:
- Dealer deploys contract with secret number 8
- Alice guesses 5 with 0.01 ETH
- Bob guesses 3 with 0.01 ETH
- Charlie guesses 8 with 0.01 ETH
- Alice calls "settle the bet", which sends 0.03 ETH to Charlie (winner)
- If no correct guesses, Dealer gets the pot

### Considerations:

- **Must all guesses be unique?**
No, they will split the pot

- **If there are no correct guesses, what happens?**
Dealer gets pot

- **Can the contract be reused? If so, how is the secret number reset?**
No, reuse. One-time game.

- **Who decides on the initial secret number?**
Dealer, in the future will generate programmatically

- **Who can settle the bet?** Anyone? Or just dealer. Or time-based. Anyone and time-based. For example, only after 24 hours.

### Other ideas:

- program random number generation into contract (psuedo-random / VRF)

### Learnings:
- Contract does not receive ETH by default: If neither a receive Ether nor a payable fallback function is present, the contract cannot receive Ether through regular transactions and throws an exception.
- Contract cannot react to ETH transfers
- Receive function executes on calls with no data (calldata) e.g. send() or transfer()
- Constructor arguments are appended to the last bytes of the contract creation code, visible on the blockchain. Therefore, one cannot add private information (like a secret number) in the constructor

### Questions:
- If there's custom logic inside the receive function (e.g. store a variable to storage), and a normal send is only 21000 gas units, how will it react to the send?
- How much gas does it cost to emit an event and how are those units calculated
- How does assert, require, revert differ?
- Does modifier cost more gas than just a require?

### TODO
- wrap up testing
- follow-up on questions

### References
- More on Receive function: https://blog.soliditylang.org/2020/03/26/fallback-receive-split/#:~:text=receive%20plain%20ether.-,receive(),send()%20or%20transfer()%20.

- How does this example work? Pay more gas? https://ethereum-blockchain-developer.com/028-fallback-view-constructor/02-receive-fallback-function/

- How to send Ether properly https://solidity-by-example.org/sending-ether/

- How mappings default values https://ethereum.stackexchange.com/questions/13021/how-can-i-figure-out-if-a-certain-key-exists-in-a-mapping-struct-defined-inside