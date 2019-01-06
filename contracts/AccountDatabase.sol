pragma solidity ^0.5.0;

contract AccountDatabase {

    //item info

    struct Database {
        uint count; //no of items
        mapping(uint => address) items; // index - item address
    }

    struct ItemOwnershipDatabase {
        uint count; //no of items
        mapping(uint => address) idItemOwned; // index - item address
        mapping(address => uint) itemOwnedId; // itemAddress - index
    }

    //publick key - item info
    mapping(address => Database) public databases;
    
    mapping(address => ItemOwnershipDatabase) public itemOwnershipDatabase;
    
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

    function findOwnedItems() public view returns (uint _count, address[] memory _items) {
        _count = itemOwnershipDatabase[msg.sender].count;
        _items = new address[](_count);
        for (uint i = 0; i < _count; i++) {
            _items[i] = itemOwnershipDatabase[msg.sender].idItemOwned[i];
        }
    }    

    function removeOwnership(address item, address currentOwner) private {
        uint id = itemOwnershipDatabase[currentOwner].itemOwnedId[item];

        itemOwnershipDatabase[currentOwner].idItemOwned[id] = address(0x0);
        itemOwnershipDatabase[currentOwner].itemOwnedId[item] = 0;
    }

    function addOwnership(address item, address newOwner) public {
        //Assign the new item owner ship
        uint currentCount = itemOwnershipDatabase[newOwner].count;

        itemOwnershipDatabase[newOwner].idItemOwned[currentCount] = item;
        itemOwnershipDatabase[newOwner].itemOwnedId[item] = currentCount;
        itemOwnershipDatabase[newOwner].count++;
    }



    function transferOwnership(address item, address currentOwner, address newOwner) public {
        require(item.owner() == msg.sender, "Not the owner of this item, cannot transfer!!")
        removeOwnership(item, currentOwner);

        addOwnership(item, newOwner);
        
    }
}


