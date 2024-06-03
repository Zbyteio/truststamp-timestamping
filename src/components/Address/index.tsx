import { useState } from 'react';
import Image from 'next/image';
import { Tooltip } from 'antd';
import CopyIcon from '@/assets/icons/content_copy.svg';
import formatAddress from '@/utils/format-address';
import './style.scss';

interface Props {
	address: string;
}

export default function Address(props: Props) {
	const [copied, setCopied] = useState(false);
	const copyAddress = () => {
		navigator.clipboard.writeText(props.address);
		setCopied(true);
	};

	return (
		<span className="address">
			<Tooltip title={props.address}>{formatAddress(props.address)}</Tooltip>
			<Tooltip title={copied ? 'Copied!' : 'Copy'} onOpenChange={open => setCopied(open ? false : true)}>
				<button className="reset" onClick={() => copyAddress(props.address)}>
					<Image src={CopyIcon} alt="" />
				</button>
			</Tooltip>
		</span>
	);
}
