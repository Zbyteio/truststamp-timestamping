import {
    NetworkConfig,
    OperationSign,
    UnsignedBatchTx,
    UnsignedTxn,
    IWalletUI,
    WalletUIConfig,
  } from "@zbyteio/zbyte-common";
  import { IzbyteWallet } from "@zbyteio/zbyte-relay-client";
  import { estimateGasTransfer, invokeEstimateDetails } from "@zbyteio/zbyte-wallet-sdk-core";
  import { EstimateGasTransferRequest } from "@zbyteio/zbyte-wallet-sdk-core";
  
  export class MockZbyteWallet implements IWalletUI {
    private wallet: IzbyteWallet;
    constructor(wallet: IzbyteWallet) {
      this.wallet = wallet;
    }
    isConnected(): boolean {
      throw new Error("Method not implemented.");
    }
    listTransaction(address: string): any[] {
      throw new Error("Method not implemented.");
    }
    init(config: WalletUIConfig): void {
      throw new Error("Method not implemented.");
    }
    open(): void {
      throw new Error("Method not implemented.");
    }
    getNetwork(): NetworkConfig {
      const networkInfo: NetworkConfig = {
        networkName: "",
        networkRpcUrl: "",
        iconPath: "",
        chainId: 0,
        chainSymbol: "",
        explorer: "",
        networkType: "",
      };
      return networkInfo;
    }
    async getAddress(): Promise<string> {
      return await this.wallet.getAddress();
    }
    connect(): Promise<any> {
      throw new Error("Method not implemented.");
    }
    
    async batchSignTypedData(txnBatch: UnsignedBatchTx): Promise<OperationSign[]> {
      const result: OperationSign[] = [];
      for (const txn of txnBatch.transactions) {
        
              const signedTxn = await this.wallet.signTypedData(JSON.stringify(txn.data), 137);
              console.log(txn.metadata.subOperation!, signedTxn);
              
              result.push({
                  operationName: txn.metadata.subOperation!,
                  signature: signedTxn,
              });
          
      }
      return result;
  }
  
  async getUserApproval(gasEstimate: number): Promise<boolean> {
    return new Promise((resolve) => {
        // eslint-disable-next-line no-restricted-globals
        const approval = confirm(`Gas estimate: ${gasEstimate} DPLAT. Do you approve?`);
        resolve(approval);
    });
  }
  
  
  
  }