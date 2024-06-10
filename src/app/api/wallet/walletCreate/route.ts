import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { storeWallet, getWallet } from '@/utils/credentials';

interface Keys {
  publicKey: string;
  privateKey: string;
}

export async function GET(req: NextRequest) {
    try {
        const existingKeys: Keys | undefined = await getWallet();
        if (!existingKeys) {
            const wallet = ethers.Wallet.createRandom();
            await storeWallet(wallet.privateKey, wallet.address);
            return NextResponse.json({ publicKey: wallet.address, privateKey: wallet.privateKey });
        } else {
            return NextResponse.json({ publicKey: existingKeys.publicKey, privateKey: existingKeys.privateKey });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate or retrieve keys' }, { status: 500 });
    }
}
