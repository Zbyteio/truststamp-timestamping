import { Button, ConfigProvider, ThemeConfig } from "antd";
import { FC } from "react";
import Image from "next/image";

type IProps = {
	text: string;
	onClick: () => void;
	icons?: HTMLImageElement;
};

const AuthButton: FC<IProps> = ({ text, onClick, icons }) => {
	const theme: ThemeConfig = {
		components: {
			Button: {
				borderRadius: 8,
				colorBorder: "rgba(82, 62, 138, 0.54)",
				colorBgContainer: "#F8F5FF",
				paddingBlock: 10,
				paddingInline: 36,
				controlHeight: 56,
				fontSize: 18,
			},
		},
	};
	return (
		<ConfigProvider theme={theme}>
			<Button type="default" onClick={onClick}>
				{icons && <Image src={icons} alt="" style={{ marginRight: 10, width: 40, height: 40 }} />}
				<span>{text}</span>
			</Button>
		</ConfigProvider>
	);
};

export default AuthButton;
