import { useKeys } from '@/context/KeysContext';
import { Signer } from '@/utils/Signer'
import { IzbyteWallet } from '@zbyteio/zbyte-common';
import { NextRequest, NextResponse } from 'next/server';
import { RelayClient } from '@zbyteio/zbyte-relay-client';
import { MockZbyteWallet } from '@/utils/mockWallet';
import { abi, contractAddress, getDataFunctionSignature,chainId } from '@/utils/constants';

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

    if (!publicKey || !privateKey) {
        return NextResponse.json({ error: 'Public and private key needed' }, { status: 400 });
    }

    const signer: IzbyteWallet = new Signer(publicKey, privateKey);
    const mockWallet = new MockZbyteWallet(signer);
    const relayClient = new RelayClient(relayConfig, mockWallet);

    try {
        const args = [publicKey];
        const result = await relayClient.invokeContract(getDataFunctionSignature, contractAddress, abi, args, chainId);
        return NextResponse.json({ result });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate or retrieve keys' }, { status: 500 });
    }
}
