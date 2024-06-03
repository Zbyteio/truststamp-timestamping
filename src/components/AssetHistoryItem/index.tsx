import { useContext, useState } from 'react';
import Image from 'next/image';
import { DownCircleTwoTone } from '@ant-design/icons';
import useVp from '@/hooks/vp';
import { WalletContext } from '@/context/Wallet';
import ERC20Icon from '@/assets/images/erc20.webp';
import './style.scss';

// type: 'assets' | 'history' TODO: this should probably be split up
// asset: transaction object, see @/props/transaction
export default function AssetHistoryItem({ type, asset }) {
	const { device } = useVp();
	const wallet = useContext(WalletContext);
	const [open, setOpen] = useState(false);

	// history-specific
	const [status, setStatus] = useState({ pending: 'Pending', failed: 'Failed', success: 'Confirmed' }[asset.status]);
	const [outgoing, setOutgoing] = useState(asset.from?.toLowerCase() === wallet.address.toLowerCase());

	const formatValue = value => (parseFloat(value) / Math.pow(10, 18)).toFixed(2);
	const formatDate = date => date.toLocaleString();

	return (
		<div className="tab-item">
			<div className="block flex">
				<a className="icon" href={`https://polygonscan.com/tx/${asset.hash}`}>
					<Image src={asset.token_logo || ERC20Icon} width={42} height={42} alt="" />
				</a>
				<div className="content">
					<div className="title">{asset.token_symbol}</div>
					{asset.value && (
						<div className="desc">
							{formatValue(asset.value)} {asset.token_symbol}<> </>
							{type === 'history' && (
								<span className={'font-0-8 ' + (outgoing ? 'outgoing' : 'incoming')}>{outgoing ? 'OUT' : 'IN'}</span>
							)}
						</div>
					)}
				</div>
			</div>

			{type === 'history' && device !== 'mobile' && (
				<>
					<div className="block">
						{asset.date && (
							<div className="content">
								<div className="title">Date</div>
								<div className="desc">{formatDate(asset.date)}</div>
							</div>
						)}
					</div>
					<div className="block">
						{asset.status && (
							<div className="content">
								<div className="title">Status</div>
								<div className="desc">{status}</div>
							</div>
						)}
					</div>
				</>
			)}

			<div className="block">
				<div className="content">
					<div className="title">Amount</div>
					<div className="desc">${formatValue(parseInt(asset.value) * (asset.token_usd || 0))}</div>
				</div>
			</div>

			{type === 'history' && device === 'mobile' && (
				<>
					<button className={`history-toggle reset ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
						<DownCircleTwoTone/>
					</button>
					{open && (
						<div className="history-dropdown">
							<hr/>
							<div className="flex">
								<div className="block">
									{asset.date && (
										<div className="content">
											<div className="title">Date</div>
											<div className="desc">{formatDate(asset.date)}</div>
										</div>
									)}
								</div>
								<div className="block">
									{asset.status && (
										<div className="content">
											<div className="title">Status</div>
											<div className="desc">{status}</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};
