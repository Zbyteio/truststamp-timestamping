import { useKeys } from '@/context/KeysContext';
import { Signer } from '@/utils/Signer';
import { IzbyteWallet } from '@zbyteio/zbyte-common';
import { NextRequest, NextResponse } from 'next/server';
import { RelayClient } from '@zbyteio/zbyte-relay-client';
import { MockZbyteWallet } from '@/utils/mockWallet';
import { abi, contractAddress, storeFunctionSignature, chainId } from '@/utils/constants';
import { Mutex } from 'async-mutex';

const relayConfig = {
    relayBaseURL: "https://dplat.zbyte.io/relay/v1",
    nativeChainId: 137,
    pollWait: 5000,
    pollTimeOut: 300000,
};

const mutex = new Mutex();

export async function GET(req: NextRequest) {
    const publicKey = req.nextUrl.searchParams.get('publicKey') || "";
    const privateKey = req.nextUrl.searchParams.get('privateKey') || "";
    const hashedData = req.nextUrl.searchParams.get('hashedData') || "";
    const fileName = req.nextUrl.searchParams.get('fileName') || "";

    if (!publicKey || !privateKey || !hashedData || !fileName) {
        return NextResponse.json({ error: 'Public key, private key, hashed data, and file name are required' }, { status: 400 });
    }

    return await mutex.runExclusive(async () => {
        const signer: IzbyteWallet = new Signer(publicKey, privateKey);
        const mockWallet = new MockZbyteWallet(signer);
        const relayClient = new RelayClient(relayConfig, mockWallet);

        try {
            const args = [publicKey, hashedData, fileName];
            const result = await relayClient.invokeContract(storeFunctionSignature, contractAddress, abi, args, chainId);
            return NextResponse.json({ transactionHash: result.transactionHash });
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: 'Failed to generate or retrieve keys' }, { status: 500 });
        }
    });
}
