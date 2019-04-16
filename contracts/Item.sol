pragma solidity ^0.5.0;

import "./AccountDatabase.sol";

contract Item {
    address public owner;
    address public prevOwner;
    string public name;

    address public manufacturer;
    uint public createdDate;

    // Represents the contract owner
    struct OwnerTraceNode {
        address owner;
        string extraInfo;
        bytes32 nextOwnerId;
        uint ownedDate;
        uint ownerTransferMode;
    }

    bytes32 public headOwnerId;

    mapping(bytes32 => OwnerTraceNode) public idTraceNodeMap;
    uint public length = 0;

    AccountDatabase internal accountDB = AccountDatabase(0x74444C982F8e90b6036b3043EA6fA206D2c7D0f6);

    function addOwnerTraceNode(address _ownerAddress, string memory _extraInfo, uint _ownedDate, uint _ownerTranferMode) private {
        OwnerTraceNode memory ownerTraceNode = OwnerTraceNode(_ownerAddress, _extraInfo, headOwnerId, _ownedDate, _ownerTranferMode);

        bytes32 ownerId = keccak256(abi.encodePacked(_ownerAddress,now,length));
        idTraceNodeMap[ownerId] = ownerTraceNode;
        headOwnerId = ownerId;
        length = length + 1;

    }




    constructor(string memory _name) public {
        name = _name;
        owner = msg.sender;
        manufacturer = msg.sender;
        accountDB.addItem(address(this), msg.sender);
        accountDB.addOwnership(address(this), msg.sender);

        createdDate = now;
        addOwnerTraceNode(owner, "Default Owner###", createdDate, 0);

    }

    modifier onlyOwner() {
        require(msg.sender == owner, "This action can only be performed by the owner of this contract!!");
        _;
    }

    function transferOwnership(address _newOwner, string memory _extraInfo) public onlyOwner {
        prevOwner = owner;
        owner = _newOwner;

        //Add a new Line to extraInfo
        addOwnerTraceNode(_newOwner, strConcat(_extraInfo, "###"), now, 0/*Normal Transfer*/);
        accountDB.transferOwnership(address(this), msg.sender, _newOwner);
    }

    function rejectOwnership(string memory _extraInfo) public onlyOwner {

        require(prevOwner != address(0x0), "Previous owner is not found, use transferOwnership method");

        //Change the ownership in AccountDatabase
        accountDB.transferOwnership(address(this), msg.sender, prevOwner);

        owner = prevOwner;
        prevOwner = msg.sender;

        addOwnerTraceNode(owner, strConcat(_extraInfo, "###"), now, 1/*Rejection*/);
    }

    function getOwnershipTrace() public view returns (uint  _count, address[] memory _owners, uint[] memory _ownershipTransferDates, 
        uint[] memory _ownershipTransferModes, string memory _ownershipTrace) {

        _count = length;
        _owners = new address[](_count);
        _ownershipTransferDates = new uint[](_count);
        _ownershipTransferModes = new uint[](_count);

        bytes32 current = headOwnerId;

        uint _i = 0;
        while( current != 0 ){
            string memory extraInfo = idTraceNodeMap[current].extraInfo;

            //Set owner array elements
            _owners[_i] = idTraceNodeMap[current].owner;
            _ownershipTransferDates[_i] = idTraceNodeMap[current].ownedDate;
            _ownershipTransferModes[_i] = idTraceNodeMap[current].ownerTransferMode;

            _ownershipTrace = strConcat(_ownershipTrace, extraInfo);

            current = idTraceNodeMap[current].nextOwnerId;
            _i++;
        }

    }


    function strConcat(string memory _a, string memory _b) internal pure returns (string memory){
        bytes memory _aBytes = bytes(_a);
        bytes memory _bBytes = bytes(_b);

        string memory _ab = new string(_aBytes.length + _bBytes.length);
        bytes memory _abBytes = bytes(_ab);
        uint k = 0;
        uint i = 0;

        for (i = 0; i < _aBytes.length; i++) { 
            _abBytes[k++] = _aBytes[i]; 
        }
        
        for (i = 0; i < _bBytes.length; i++) {
             _abBytes[k++] = _bBytes[i];
        }

        return string(_abBytes);
    }
}