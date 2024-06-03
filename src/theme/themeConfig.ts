import type { ThemeConfig } from "antd";

const theme: ThemeConfig = {
	token: {
		colorPrimary: "#523E8A",
	},

	components: {
		Typography: { fontWeightStrong: 500 },
		Button: {
			colorPrimary: "#523E8A",
			borderRadius: 3,
			primaryShadow: "none",
		},
		Tabs: {
			colorPrimary: "#503A92",
			itemColor: "#909090",
			colorBorderSecondary: "#B8B8B8",
		},
	},
};

export default theme;
