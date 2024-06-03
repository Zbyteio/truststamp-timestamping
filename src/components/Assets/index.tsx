import { useContext, useState, useEffect } from 'react';
import { Button } from 'antd';
import { WalletContext } from '@/context/Wallet';
import TabsLoader from '@/components/TabsLoader';
import AssetHistoryItem from '@/components/AssetHistoryItem';
import polygon from '@/utils/polygon';
import moralis from '@/utils/moralis';
import tokenUSD from '@/utils/token-usd';
import { MATIC_ADDRESS } from '@/constants/addresses';

export default function AssetsItem(props) {
	const wallet = useContext(WalletContext);
	const [fetching, setFetching] = useState(0);
	const [assets, setAssets] = useState([]);
	const [errors, setErrors] = useState([]);

	const fetchAssets = async () => {
		setErrors([]);
		setFetching(1);

		const chain = {
			137: 'polygon'
		}[wallet.core.getNetwork().chainId];

		const errors = [];
		const tokens = [];

		const fetches = await Promise.all([
			polygon({ module: 'account', action: 'balance', address: wallet.address }),
			moralis(`/api/v2.2/${wallet.address}/erc20?chain=${chain}`)
		]);

		fetches.filter(t => t[0]).forEach(error => {
			console.error(error);
			errors.push(error);
		});
		setErrors(errors);

		const matic = fetches[0][1];
		matic && tokens.push({
			value: matic,
			token_address: MATIC_ADDRESS,
			token_symbol: 'MATIC',
			token_logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
		});

		const erc20 = fetches[1][1];
		erc20 && tokens.push(...erc20.map(obj => ({
			value: obj.balance,
			token_address: obj.token_address,
			token_symbol: obj.symbol,
			token_logo: obj.logo
		})));

		setAssets(tokens);
		setFetching(2);

		await tokenUSD.fetch(tokens.map(tx => ({ token_symbol: tx.token_symbol, token_address: tx.token_address })), chain);
		tokens.forEach(tx => tx.token_usd = tokenUSD.get(tx.token_symbol));
		setAssets([...tokens]);
	};

	useEffect(() => {
		props.clicked !== null && fetchAssets();
	}, [props.clicked]);

	return (
		<>
			<TabsLoader state={fetching}/>
			<div className="tab-items assets">
				{errors.length ? null : errors.map(error => <p key={error}>{error}</p>)}
				{!errors.length && assets.map((asset, i) => <AssetHistoryItem key={`${asset.token_symbol}-${i}`} asset={asset}/>)}
			</div>
		</>
	);
};
