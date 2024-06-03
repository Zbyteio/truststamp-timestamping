'use client';

import { useEffect, useState, useContext } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import { Button, ConfigProvider, Input, Modal, ThemeConfig, Form } from 'antd';
import { WalletContext } from '@/context/Wallet';
import { TRUSTED_FORWARDER } from '@/constants/addresses';
import { zbyteAbi } from '@/constants/zbyte';
import relay from '@/utils/relay';
import prepWalletTx from '@/utils/prep-wallet-tx';
import Flash from '@/components/Flash';
import image from '@/assets/images/image1.png';
import noImage from '@/assets/images/no-image.png';
import zbyteIcon from '@/assets/images/zbyte-icon.png';
import SendIcon from '@/assets/icons/send.svg';
import './style.scss';

interface Props {
	nft: Object;
	onTransferred?: Function;
}

export default function ImageItem(props: Props) {
	const wallet = useContext(WalletContext);
	const [isZbyteContract, setIsZbyteContract] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [pending, setPending] = useState(0);
	const [error, setError] = useState(null);

	let imageSrc;
	try {
		const { image } = JSON.parse(props.nft.metadata);
		imageSrc = `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}`;
	} catch(e) {}

		useEffect(() => {
			checkIfZbyteContract(props.nft);
		}, []);

		const reset = retry => {
			setModalOpen(retry);
			setPending(0);
			setError(null);
		};

		const checkIfZbyteContract = async nft => {
			const [error, json] = await polygon({
				module: 'contract',
				action: 'getabi',
				address: nft.token_address
			});

			if (error) return setIsZbyteContract(false);

			const contract = new ethers.Contract(nft.token_address, json);

			// TODO: check if contract has method in a better way
			setIsZbyteContract(typeof contract.isTrustedForwarder === 'function' && contract.isTrustedForwarder(TRUSTED_FORWARDER));
		};

		const onSubmit = async values => {
			setError(null);
			setPending(1);

			if (globalThis.__error) {
				setError(`${globalThis.__error}`);
				setModalOpen(false);
				setPending(3);
				return;
			}

			if (globalThis.__succeed) {
				const timeout = typeof globalThis.__succeed === 'number' ? globalThis.__succeed : 1000;
				await new Promise(r => setTimeout(r, timeout));
				setModalOpen(false);
				setPending(2);
				props.onTransferred?.(props.nft);
				return;
			}

			const [error, result] = await (
				isZbyteContract ? transferZbyteNft(props.nft, values.address) : transferNft(props.nft, values.address)
			);

			console.log(error, result);

			error && setError('Failed to transfer NFT.');
			setPending(error ? 3 : 2);
			setModalOpen(false);

			!error && props.onTransferred?.(props.nft);
		};

		const transferZbyteNft = async (nft, recipient) => {
			let result;
			try {
				result = await relay(wallet.core).invokeContract(
					'safeTransferFrom',
					nft.token_address,
					zbyteAbi,
					[wallet.address, recipient, nft.token_id],
					wallet.core.getNetwork().chainId
				);
			} catch(e) {
				return [e];
			}

			return [null, result];
		};

		// TODO: wait for transaction receipt, not response, to confirm success
		const transferNft = async (nft, recipient) => {
			const [error, json] = await polygon({
				module: 'contract',
				action: 'getabi',
				address: nft.token_address
			});
			if (error) return [error, json];

			// TODO: erc1155?
			const contract = new ethers.Contract(nft.token_address, json);
			const data = contract.interface.encodeFunctionData(
				'safeTransferFrom(address,address,uint256)',
				[wallet.address, recipient, nft.token_id]
			);

			return (await prepWalletTx(wallet.core)).broadcastRawTx({ data, to: nft.token_address });
		};

		return (
			<div className="nft">
				<div className="nft-image">
					<Image src={noImage} alt=""/>
					{imageSrc && <img src={imageSrc} alt=""/>}
				</div>
				<div>
					<div className="nft-title">{`${props.nft.name}`}</div>
					<div className="nft-desc">Pasión Mediterránea TODO</div>
				</div>
				<div className="nft-transfer">
					<Button type="primary" onClick={() => setModalOpen(true)}>
						Transfer <Image src={SendIcon} alt=""/>
					</Button>
					{isZbyteContract && <Image src={zbyteIcon} alt="" style={{width:"25px", height:"25px", borderRadius:"50%"}}/>}
				</div>

				<Modal
					title="Transfer your NFT"
					className="nft-transfer-form"
					open={modalOpen}
					onOk={() => setModalOpen(false)}
					onCancel={() => setModalOpen(false)}
					footer={null}
				>
					<div className="modal-content">
						<Form layout="vertical" onFinish={onSubmit}>
							<Form.Item label="Recipient address" name="address" rules={[{ required: true }]}>
								<Input placeholder="0xdef4..."/>
							</Form.Item>

							<Button
								htmlType="submit"
								type="primary"
								size="large"
								block={true}
								loading={pending === 1}
							>Transfer</Button>
						</Form>
					</div>
				</Modal>

				<Modal open={pending === 3} footer={null} closable={false} onCancel={reset}>
					<Flash
						type="error"
						header="Failed"
						error={error}
						description="Failed to transfer NFT, try again."
						onDone={reset}
					/>
				</Modal>
			</div>
		);
};
