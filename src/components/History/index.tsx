import { useContext, useState, useEffect } from 'react';
import { Button } from 'antd';
import { WalletContext } from '@/context/Wallet';
import { formatTxPolygon, formatTxMoralis } from '@/props/transaction';
import TabsLoader from '@/components/TabsLoader';
import AssetHistoryItem from '@/components/AssetHistoryItem';
import polygon from '@/utils/polygon';
import moralis from '@/utils/moralis';
import tokenUSD from '@/utils/token-usd';

export default function HistoryItem(props) {
	const wallet = useContext(WalletContext);
	const [txs, setTxs] = useState([]);
	const [fetching, setFetching] = useState(0);
	const [errors, setErrors] = useState([]);

	const fetchHistory = async () => {
		setErrors([]);
		setFetching(1);

		const errors = [];
		const txs = [];

		const fetches = await Promise.all([
			polygon({ address: wallet.address, module: 'account', action: 'txlist' }),
			moralis(`/api/v2.2/${wallet.address}/erc20/transfers?chain=polygon`)
		]);

		fetches.filter(t => t[0]).forEach(error => {
			console.error(error);
			errors.push(error);
		});

		const [matic, erc] = [fetches[0][1], fetches[1][1]];
		matic.length && txs.push(...matic.map(obj => formatTxPolygon(obj, 'polygon')));
		erc?.result?.length && txs.push(...erc.result.map(obj => formatTxMoralis(obj, 'moralis')));

		setErrors(errors);
		setTxs(txs.sort((a, b) => b.date - a.date));
		setFetching(2);

		const uniqs = {};
		txs.forEach(obj => uniqs[obj.token_symbol] ||= obj);
		await tokenUSD.fetch(Object.values(uniqs), 'polygon');

		txs.forEach(tx => tx.token_usd = tokenUSD.get(tx.token_symbol));
		setTxs([...txs]);
	};

	useEffect(() => {
		props.clicked !== null && fetchHistory();
	}, [props.clicked]);

	return (
		<>
			<TabsLoader state={fetching}/>
			<div className="tab-items history">
				{errors.length ? null : errors.map(error => <p key={error}>{error}</p>)}
				{!errors.length && txs.map((tx, i) => <AssetHistoryItem type="history" key={i} asset={tx}/>)}
			</div>
		</>
	);
};
