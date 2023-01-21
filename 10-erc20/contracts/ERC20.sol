// SPDX-License-Identifier: deez nuggetz
pragma solidity ^0.8.17;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address _addr) external view returns (uint256);

    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256);

    function transfer(address _to, uint256 _amount) external returns (bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool);

    function approve(address _spender, uint256 _amount)
        external
        returns (uint256);

    event Transfer(address indexed _from, address indexed _to, uint256 _amount);

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _amount
    );
}

contract ERC20 is IERC20 {
    uint256 tokenSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;

    // mints all supply to deployer
    constructor(uint256 initialSupply) {
        tokenSupply = initialSupply;
        balances[msg.sender] = initialSupply;
    }

    function totalSupply() external view returns (uint256) {
        return tokenSupply;
    }

    function balanceOf(address _addr) external view returns (uint256) {
        return balances[_addr];
    }

    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256)
    {
        return allowances[_owner][_spender];
    }

    function transfer(address _to, uint256 _amount) external returns (bool) {
        require(
            balances[msg.sender] >= _amount,
            "Sender does not have sufficient balance to transfer"
        );

        balances[msg.sender] -= _amount;
        balances[_to] += _amount;

        emit Transfer(msg.sender, _to, _amount);

        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool) {
        require(
            allowances[_from][msg.sender] >= _amount,
            "Spender does not have sufficient allowance to transfer"
        );
        require(
            balances[_from] >= _amount,
            "Owner does not have sufficient balance to transfer"
        );

        allowances[_from][msg.sender] -= _amount;
        balances[_from] -= _amount;
        balances[_to] += _amount;

        emit Transfer(_from, _to, _amount);

        return true;
    }

    function approve(address _spender, uint256 _amount)
        external
        returns (uint256)
    {
        allowances[msg.sender][_spender] = _amount;

        emit Approval(msg.sender, _spender, _amount);

        return _amount;
    }
}
