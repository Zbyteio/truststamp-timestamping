export const abi = [ { "inputs": [], "name": "CannotSendEther", "type": "error" }, { "inputs": [], "name": "ZeroAddress", "type": "error" }, { "inputs": [], "name": "ZeroValue", "type": "error" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "address", "name": "", "type": "address" }, { "indexed": false, "internalType": "address", "name": "", "type": "address" } ], "name": "ForwarderSet", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "_walletAddress", "type": "address" } ], "name": "getDataByWallet", "outputs": [ { "components": [ { "internalType": "string", "name": "walletAddress", "type": "string" }, { "internalType": "string", "name": "hash", "type": "string" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" } ], "internalType": "struct DataStorageContract.Data[]", "name": "", "type": "tuple[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "forwarder_", "type": "address" } ], "name": "isTrustedForwarder", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "forwarder_", "type": "address" } ], "name": "setTrustedForwarder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "_walletAddress", "type": "string" }, { "internalType": "string", "name": "_hash", "type": "string" }, { "internalType": "string", "name": "_name", "type": "string" } ], "name": "storeData", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ];
export const chainId = 137;
export const storeFunctionSignature = "storeData(string,string,string)";
export const contractAddress = "0x640D69B1f2105FCe2ed51cDa4BE1A309A1A006f9";
export const byteCode = "";
export const getDataFunctionSignature = "getDataByWallet(address)";