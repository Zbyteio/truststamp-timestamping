import { useState, useRef, useEffect } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import Address from '@/components/Address';
import './style.scss';

interface Props {
	address: string;
	qr: {
		data: string;
	}
}

export default function QrCode(props: Props) {
	const [loading, setLoading] = useState(true);
	const img = useRef(null);
	const qrParams = Object.entries(props.qr).map(([k, v]) => `${k}=${v}`).join('&');

	useEffect(() => {
		img.current.addEventListener('load', () => setLoading(false), { once: true });
	}, []);

	return (
		<div className="qr-code">
			<div className="image-outer">
				<div className="image-inner">
					<img ref={img} src={`https://api.qrserver.com/v1/create-qr-code/?${qrParams}`}/>
					{loading && <LoadingOutlined spin={true}/>}
				</div>
			</div>
			<hr/>
			<p className="text-center text-purple font-1-4">
				Scan this code to send tokens to <Address address={props.address}/>
			</p>
		</div>
	);
}
