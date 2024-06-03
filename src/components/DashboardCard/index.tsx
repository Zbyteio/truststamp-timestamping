import { useContext, useState, useEffect } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import { Button, Tooltip, Modal } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { DPLAT_ADDRESS, VZBYTE_ADDRESS } from '@/constants/addresses';
import tokenUSD from '@/utils/token-usd';
import relay from '@/utils/relay';
import prepWalletTx from '@/utils/prep-wallet-tx';
import formatAddress from '@/utils/format-address';
import { WalletContext } from '@/context/Wallet';
import Address from '@/components/Address';
import QrCode from '@/components/QrCode';
import TokenTransferForm from '@/components/TokenTransferForm';
import Flash from '@/components/Flash';
import VzbyteConvertForm from '@/components/VzbyteConvertForm';
import LeftIcon from '@/assets/icons/left-icon.svg';
import RightIcon from '@/assets/icons/right-icon.svg';
import Bg from '@/assets/images/dashboard-bg.svg';
import './style.scss';

export default function DashboardCard() {
	const wallet = useContext(WalletContext);
	// dplat, vzbyte floats representing ether units
	const [dplatBalance, setDplatBalance] = useState(-1);
	const [vzbyteBalance, setVzbyteBalance] = useState(-1);
	const [usd, setUSD] = useState(-1);
	const [qrModal, setQrModal] = useState(false);
	const [transferModal, setTransferModal] = useState(false);
	const [convertModal, setConvertModal] = useState(false);
	const [transferInitialValues, setTransferInitialValues] = useState({});
	// 0 1 2 3 -- none pending success error
	const [pending, setPending] = useState(0);
	const [error, setError] = useState(null);

	useEffect(() => {
		const search = new URLSearchParams(window.location.search);
		if (search.has('transfer-to')) {
			setTransferModal(true);
			setTransferInitialValues({ address: search.get('transfer-to') });
		}
	}, []);

	let once = false;
	useEffect(() => {
		(async () => {
			if (once || wallet.connected !== 2 || !wallet.address) return;
			once = true;
			fetchBalances();
		})();
	}, [wallet]);

	const fetchBalances = async () => {
		const chain = { 137: 'polygon' }[wallet.core.getNetwork().chainId];

		let [dplat, vzbyte] = await Promise.all([
			wallet.core.getTokenBalance(),
			moralis(`/api/v2.2/${wallet.address}/erc20?chain=${chain}&token_addresses=${VZBYTE_ADDRESS}`)
		]);

		!dplat && console.error('Could not fetch dplat balance.');
		dplat = parseFloat(ethers.formatEther(dplat || '0'));

		vzbyte[0] && console.error(`Could not fetch vzbyte balance: ${vzbyte[0]}`);
		vzbyte = parseFloat(ethers.formatEther(vzbyte?.[1]?.[0].balance));

		setDplatBalance(dplat);
		setVzbyteBalance(vzbyte);

		if (!tokenUSD.has('DPLAT')) await tokenUSD.fetch([{ token_address: DPLAT_ADDRESS, token_symbol: 'DPLAT' }]);
		setUSD(dplat * tokenUSD.get('DPLAT'));
	};

	const onSubmit = async values => {
		const amount = ethers.parseUnits(values.amount, values.unit);
		const { chainId, networkRpcUrl } = wallet.core.getNetwork();

		const message = [
			`Are these transfer details accurate?`,
			`To: ${values.address}`,
			`Amount: ${values.amount} ${values.unitPretty}`,
			`Chain ID: ${chainId}`
		];

		values.nonce && message.push(`Nonce: ${values.nonce}`);
		values['gas-scaler'] && message.push(`Gas scaler: ${values['gas-scaler']}`);

		if (!window.confirm(message.join('\n'))) return;

		setPending(1);

		try {
			if (globalThis.__error) throw new Error(globalThis.__error || 'Error.');
			else if (globalThis.__succeed) await new Promise(r => setTimeout(r, 500));

			else {
				if (values.token === 'MATIC') {
					const [error] = await (await prepWalletTx(wallet.core)).broadcastRawTx({
						to: values.address,
						value: amount,
						nonce: values.nonce && parseInt(values.nonce),
						gasScaler: values['gas-scaler'] || undefined
					});
					if (error) throw error;
				} else if (values.token === 'DPLAT') {
					await relay(wallet.core).transferDplat(chainId, values.address, amount.toString());
				}
			}
		} catch(e: any) {
			console.error('Error transferring tokens', e);
			setPending(3);
			ethers.isError(e, 'REPLACEMENT_UNDERPRICED') && setError('A transaction with this nonce is already pending. To replace it, try increasing the gas price.');
			ethers.isError(e, 'NONCE_EXPIRED') && setError('A transaction with this nonce has already been processed. Please use a higher nonce.');
			return;
		}

		setPending(2);
	};

	const closeModals = () => {
		setTransferModal(false);
		setConvertModal(false);
		setPending(0);
		setError(null);
	};

	const closeFlash = retry => {
		closeModals();
		setTransferModal(retry);
	};

	const onConvert = async values => {
		setPending(1);

		const amount = ethers.parseUnits(values.amount, 'ether');
		const { chainId } = wallet.core.getNetwork();

		try {
			if (globalThis.__error) throw new Error(globalThis.__error || 'Error.');
			else if (globalThis.__succeed) await new Promise(r => setTimeout(r, 500));

			else {
				await relay(wallet.core).depositDplat(amount.toString(), chainId);
			}
		} catch(e) {
			setError(`Error converting dPlat to vZbyte: ${e}`);
			setPending(3);
			return console.warn(e);
		}

		setPending(2);

		const num = parseFloat(values.amount);
		setDplatBalance(dplatBalance - num);
		setVzbyteBalance(vzbyteBalance + num);
	};

	return (
		<div className="dashboard-card">
			<Image src={Bg} alt="" className="dashboard-bg" />
			<div className="dashboard-card-content">
				<div className="dashboard-card-wallet">
					<span className="title-1 gradient-text">zbyte wallet</span>
					<br/>
					{!wallet.address && <LoadingOutlined/>}
					{wallet.address && <Address address={wallet.address}/>}
				</div>
				<div className="info-pay-card">
					<span className="title-3 gradient-text">
						{dplatBalance === -1 && <LoadingOutlined/>}
						{dplatBalance !== -1 && dplatBalance.toFixed(2)}
						<> DPLAT</>
					</span>
					<br/>
					<span className="title-4">
						{usd === -1 && <LoadingOutlined/>}
						{usd !== -1 && usd.toFixed(2)}
						<> USDT</>
					</span>
					<div className="btn-content">
						<Button className="right-btn" onClick={() => setQrModal(true)}>
							<Image src={RightIcon} alt="" /> Receive
						</Button>
						<Button className="left-btn" onClick={() => setTransferModal(true)}>
							Send <Image src={LeftIcon} alt="" />
						</Button>
					</div>
				</div>
				{vzbyteBalance !== -1 && (
					<>
						<span className="flex">
							<span className="title-4">{vzbyteBalance.toFixed(2)} vZbyte credits</span>
							<Button type="primary" size="small" onClick={() => setConvertModal(true)}>Convert</Button>
						</span>
					</>
				)}
			</div>

			<Modal open={qrModal} footer={null} onCancel={() => setQrModal(false)}>
				<QrCode address={wallet.address} qr={{
					// TODO: this needs to be an absolute URL. Use localhost as
					// placeholder until this site is deployed.
					// https://zbyte-white-label-wallet-url.com?transfer-to=0xaddress
					data: `localhost:3000/?transfer-to=${wallet.address}`
					}}/>
			</Modal>

			<Modal open={transferModal && pending < 2} onCancel={closeModals} footer={null}>
				<TokenTransferForm
					initialValues={transferInitialValues}
					onSubmit={onSubmit}
					pending={pending === 1}
				/>
			</Modal>
			<Modal open={transferModal && pending >= 2} onCancel={closeModals} footer={null} closable={false}>
				<Flash
					type={pending === 2 ? 'success' : 'error'}
					header={pending === 2 ? 'Transferred' : 'Failed'}
					error={error}
					description={pending === 2 ? 'Your tokens transferred successfully.' : 'Failed to transfer tokens, try again.'}
					onDone={closeFlash}
				/>
			</Modal>

			<Modal open={convertModal && pending < 2} onCancel={closeModals} footer={null}>
				<VzbyteConvertForm pending={pending === 1} onSubmit={onConvert}/>
			</Modal>
			<Modal open={convertModal && pending >= 2} footer={null} onCancel={closeModals}>
				<Flash
					type={pending === 2 ? 'success' : 'error'}
					header={pending === 2 ? 'Transferred' : 'Failed'}
					error={error}
					description={pending === 2 ? 'Conversion successful.' : 'Conversion failed.'}
					onDone={closeFlash}
				/>
			</Modal>
		</div>
	);
};
