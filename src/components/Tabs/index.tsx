import { useContext, useState, useEffect } from 'react';
import { Tabs, TabsProps } from 'antd';
import { WalletContext } from '@/context/Wallet';
import History from '@/components/History';
import NFTs from '@/components/NFTs';
import Assets from '@/components/Assets';
import './style.scss';

export default function TabsCard() {
	const wallet = useContext(WalletContext);
	const [assetsClicked, setAssetsClicked] = useState(null);
	const [nftClicked, setNftClicked] = useState(null);
	const [historyClicked, setHistoryClicked] = useState(null);

	const items = [
		{
			key: 'assets',
			label: 'Assets',
			children: <Assets clicked={assetsClicked}/>
		},
		{
			key: 'nfts',
			label: 'NFTs',
			children: <NFTs clicked={nftClicked}/>
		},
		{
			key: 'history',
			label: 'History',
			children: <History clicked={historyClicked}/>
		}
	];

	const onClick = key => {
		key === 'assets' && setAssetsClicked(!assetsClicked);
		key === 'nfts' && setNftClicked(!nftClicked);
		key === 'history' && setHistoryClicked(!historyClicked);
	};

	let once = false;
	useEffect(() => {
		if (!wallet.address || once) return;
		setAssetsClicked(!assetsClicked);
	}, [wallet]);

	return (
		<div style={{ width: "100%" }}>
			<Tabs defaultActiveKey="assets" items={items} className="tabs" onTabClick={onClick}/>
		</div>
	);
};
