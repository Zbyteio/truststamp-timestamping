import { Button, Modal, Form, Input, Radio, Space, Collapse } from 'antd';
import './style.scss';

interface Props {
	onSubmit?: Function;
	pending?: Boolean;
}

export default function VzbyteConvertForm(props: Props) {
	return (
		<div className="vzbyte-convert-form">
			<h2 className="text-purple">Convert dPlat to vZbyte</h2>

			<Form layout="vertical" onFinish={props.onSubmit && props.onSubmit}>
				<Form.Item label="Amount" name="amount">
					<Input/>
				</Form.Item>
				<Button htmlType="submit" block={true} type="primary" size="large" loading={props.pending}>Submit</Button>
			</Form>
		</div>
	);
};
