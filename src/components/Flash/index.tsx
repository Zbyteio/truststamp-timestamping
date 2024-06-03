import { Button } from 'antd';
import { CheckCircleFilled, WarningOutlined } from '@ant-design/icons';
import './style.scss';

interface Props {
	type?: 'success' | 'error';
	header?: string;
	error?: string;
	description?: string;
	onDone?: Function;
}

export default function Flash(props: Props) {
	const type = props.type || 'success';
	const header = props.header || { success: 'Success', error: 'Error' }[type];
	const onDone = val => () => props.onDone && props.onDone(val)

	return (
		<div className="token-transfer-flash">
			<h2 className={`text-center text-${type === 'success' ? 'green' : 'orange'}`}>{header}</h2>

			<hr/>

			{type === 'success' ?
				<CheckCircleFilled className="icon checkmark"/> :
				<WarningOutlined className="icon warning"/>
			}

			{props.error && <p className={`text-center ${type === 'error' ? 'text-orange' : ''}`}>{props.error}</p>}

			{props.description && <p className="text-center text-purple font-1-4">{props.description}</p>}

			<p className="button-container">
				{type === 'success' && (
					<Button size="large" type="primary" onClick={onDone(false)}>Done</Button>
				)}
				{type === 'error' && (
					<>
						<Button size="large" onClick={onDone(false)}>Cancel</Button>
						<Button size="large" type="primary" onClick={onDone(true)}>Try again</Button>
					</>
				)}
			</p>
		</div>
	);
}
