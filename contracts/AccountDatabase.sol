pragma solidity ^0.5.0;

contract AccountDatabase {

    struct Database {
        uint count;
        mapping(uint => address) items;
    }

    mapping(address => Database) public databases;

    constructor() public {

    }

    function addItem(address item, address sender) public {
        databases[sender].items[databases[sender].count++] = item;
    }

    function findItems() public view returns (uint _count, address[] memory _items) {
        _count = databases[msg.sender].count;
        _items = new address[](_count);
        for (uint i = 0; i < _count; i++) {
            _items[i] = databases[msg.sender].items[i];
        }
    }
}