import { useKeys } from '@/context/KeysContext';
import { Signer } from '@/utils/Signer'
import { IzbyteWallet } from '@zbyteio/zbyte-common';
import { NextRequest, NextResponse } from 'next/server';
import { RelayClient } from '@zbyteio/zbyte-relay-client';
import { MockZbyteWallet } from '@/utils/mockWallet';
import { abi, contractAddress, byteCode, chainId } from '@/utils/constants';

interface Keys {
    publicKey: string;
    privateKey: string;
}

const relayConfig = {
    relayBaseURL: "https://dplat.zbyte.io/relay/v1",
    nativeChainId: 137,
    pollWait: 5000,
    pollTimeOut: 300000,
};

export async function GET(req: NextRequest) {
    const publicKey = req.nextUrl.searchParams.get('publicKey') || "";
    const privateKey = req.nextUrl.searchParams.get('privateKey') || "";
    const hashedData = req.nextUrl.searchParams.get('hashedData') || "";
    const fileName = req.nextUrl.searchParams.get('fileName') || "";

    const signer: IzbyteWallet = new Signer(publicKey, privateKey);
    const mockWallet = new MockZbyteWallet(signer);
    const relayClient = new RelayClient(relayConfig, mockWallet);

    try {
        const args = [publicKey, hashedData, fileName];
        const result = await relayClient.deployContract(byteCode,abi, [], chainId);
        return NextResponse.json({ contractAddress: result?.contractAddress });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate or retrieve keys' }, { status: 500 });
    }
}
