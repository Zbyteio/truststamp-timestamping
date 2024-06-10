import { signTypedMessage } from 'eth-sig-util';
import {
    NetworkConfig,
    OperationSign,
    UnsignedBatchTx,
    IWalletUI,
    WalletUIConfig,
    IzbyteWallet,
} from '@zbyteio/zbyte-common';
import { ethers } from 'ethers';

export class Signer implements IzbyteWallet {
    privateKeyBuffer: Buffer;
    constructor(
        private account: string,
        private privateKey: string,
    ) {
        this.privateKeyBuffer = Buffer.from(
            ethers.getBytes(this.privateKey).buffer,
        );
    }
    setNetwork(networkConfig: NetworkConfig): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getNetwork(): NetworkConfig {
        throw new Error('Method not implemented.');
    }
    isConnected(): boolean {
        throw new Error('Method not implemented.');
    }
    sendToken(toAddress: string, amount: string): Promise<any> {
        throw new Error('Method not implemented.');
    }
    connect() {
        throw new Error('Method not implemented.');
    }
    batchSignTypedData(transaction: UnsignedBatchTx): Promise<OperationSign[]> {
        throw new Error('Method not implemented.');
    }
    getTokenBalance(address: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    async signTypedData(transaction: string, chainId: number): Promise<string> {
        const parsedTx = JSON.parse(transaction);

        return signTypedMessage(this.privateKeyBuffer, {
            data: parsedTx,
        });
    }

    async getAddress(): Promise<string> {
        return this.account;
    }
}