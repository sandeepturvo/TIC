pragma solidity ^0.5.0;

import "./AccountDatabase.sol";

contract Item {
    string public name;
    address public manufacturer;

    constructor(string memory _name) public {
        name = _name;
        manufacturer = msg.sender;
        AccountDatabase(address(0xc210017307bd3EAF08067aCcD2e0b899eB439d3E)).addItem(address(this), msg.sender);
    }
}