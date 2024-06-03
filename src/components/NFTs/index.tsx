import { useContext, useState, useEffect } from 'react';
import { Modal } from 'antd';
import { WalletContext } from '@/context/Wallet';
import Flash from '@/components/Flash';
import TabsLoader from '@/components/TabsLoader';
import NFTItem from '@/components/NFTItem';
import moralis from '@/utils/moralis';

export default function NFTs(props) {
	const wallet = useContext(WalletContext);
	const [nfts, setNfts] = useState([])
	const [fetching, setFetching] = useState(0)
	const [flash, setFlash] = useState(false);

	useEffect(() => {
		props.clicked !== null && fetchNfts();
	}, [props.clicked]);

	const fetchNfts = async () => {
		setFetching(1);
		const chain = { 137: 'polygon' }[wallet.core.getNetwork().chainId];
		const [error, response] = await moralis(`/api/v2.2/${wallet.address}/nft?chain=${chain}&format=decimal&media_items=false`);
		setFetching(2);

		if (error) return console.warn(error);
		setNfts(response.result);
	};

	const onTransferred = nft => {
		setFlash(true);
		nfts.splice(nfts.indexOf(nft), 1);
		setNfts([...nfts]);
	};

	return (
		<>
			<TabsLoader state={fetching}/>
			<div className="nfts">
				{nfts.map(nft => <NFTItem key={nft.token_hash} nft={nft} onTransferred={onTransferred}/>)}
			</div>

			<Modal open={flash} footer={null} closable={false}>
				<Flash
					type="success"
					header="Transferred"
					description="Your NFT transferred successfully."
					onDone={() => setFlash(false)}
				/>
			</Modal>
		</>
	);
};
