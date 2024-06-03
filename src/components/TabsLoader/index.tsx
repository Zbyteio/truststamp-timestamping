import { LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './style.scss';

interface Props {
	state: Integer; // 0 initial, 1 loading, 2 done
}

export default function TabsLoader(props: Props) {
	return (
		<div className={`tabs-loader ${props.state === 1 ? 'visible' : ''}`}>
			&nbsp;
			{props.state === 1 ? <LoadingOutlined/> : <CheckCircleOutlined/>}
		</div>
	);
}
