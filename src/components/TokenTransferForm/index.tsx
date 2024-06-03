import { ReactNode } from 'react';
import { Button, Modal, Form, Input, Radio, Space, Collapse } from 'antd';
import './style.scss';

interface Props {
	onSubmit?: Function;
	pending?: Boolean;
	initialValues?: Object;
}

export default function TokenTransferForm(props: Props) {
	const [form] = Form.useForm();
	const unitPretty = Form.useWatch(values => ({ MATIC: 'Matic', DPLAT: 'dPlat' }[values.token]), form);

	const initialValues = Object.assign({ token: 'MATIC', unit: 'ether' }, props.initialValues || {});

	const onSubmit = values => {
		if (!props.onSubmit) return;
		values.unitPretty = values.unit === 'ether' ?
			unitPretty :
			{ gwei: 'Gwei', wei: 'Wei' }[values.unit];
		props.onSubmit(values);
	};

	return (
		<div className="token-transfer-form">
			<h2 className="token-transfer-form-title">Transfer</h2>

			<Form
				form={form}
				onFinish={onSubmit}
				initialValues={initialValues}
				layout="vertical"
			>
				<Form.Item label="Token" name="token" rules={[{ required: true }]}>
					<Radio.Group>
						<Radio value="MATIC">Matic</Radio>
						<Radio value="DPLAT">dPlat</Radio>
					</Radio.Group>
				</Form.Item>
				<Form.Item label="Recipient address" name="address" rules={[{ required: true }]}>
					<Input/>
				</Form.Item>
				<Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
					<Input/>
				</Form.Item>
				<Form.Item label="Unit" name="unit" rules={[{ required: true }]}>
					<Radio.Group>
						<Space direction="vertical">
							<Radio value="ether">{unitPretty} <small>(10<sup>18</sup>n)</small></Radio>
							<Radio value="gwei">Gwei <small>(10<sup>9</sup>n)</small></Radio>
							<Radio value="wei">Wei <small>(1n)</small></Radio>
						</Space>
					</Radio.Group>
				</Form.Item>
				<Collapse className="advanced" items={[{ key: 'advanced', label: 'Advanced', children: (
					<>
						<Form.Item label="Nonce" name="nonce">
							<Input type="number" placeholder="optional (use transaction count)"/>
						</Form.Item>
						<Form.Item label="Gas scaler" name="gas-scaler">
							<Input type="number" placeholder="100 (100% AKA default gas fee)"/>
						</Form.Item>
					</>
				) }]}/>
				<Button htmlType="submit" block={true} type="primary" size="large" loading={props.pending}>Submit</Button>
			</Form>
		</div>
	);
}
