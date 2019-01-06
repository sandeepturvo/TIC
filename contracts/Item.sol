pragma solidity ^0.5.0;

import "./AccountDatabase.sol";

contract Item {
    address public owner;
    string public name;

    address public manufacturer;

    // Represents the contract owner
    struct OwnerTraceNode {
        address owner;
        string extraInfo;
        bytes32 nextOwnerId;
    }

    bytes32 public headOwnerId;

    mapping(bytes32 => OwnerTraceNode) public idTraceNodeMap;
    uint public length = 0;

    AccountDatabase internal accountDB = AccountDatabase(0x4FD47d35FE118c9844B4d8a2b2223E6313Ec5c9f);

    function addOwnerTraceNode(address _ownerAddress, string memory _extraInfo) private {
        OwnerTraceNode memory ownerTraceNode = OwnerTraceNode(_ownerAddress, _extraInfo, headOwnerId);

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

        addOwnerTraceNode(owner, "Initial owner  ###");

    }

    modifier onlyOwner() {
        require(msg.sender == owner, "This action can only be performed by the owner of this contract!!");
        _;
    }

    function transferOwnership(address _newOwner, string memory _extraInfo) public onlyOwner {
        owner = _newOwner;

        //Add a new Line to extraInfo
        addOwnerTraceNode(_newOwner, strConcat(_extraInfo, "###"));
        accountDB.transferOwnership(address(this), msg.sender, _newOwner);
    }

    function getOwnershipTrace() public view returns (string memory) {
        string memory ownershipTrace = "";

        bytes32 current = headOwnerId;

        while( current != 0 ){
            string memory extraInfo = idTraceNodeMap[current].extraInfo;

            current = idTraceNodeMap[current].nextOwnerId;


            ownershipTrace = strConcat(ownershipTrace, extraInfo);

        }

        return ownershipTrace;
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