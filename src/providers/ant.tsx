"use client";

import React from "react";

import { AntdRegistry } from "@ant-design/nextjs-registry";

const AntdProvider: React.FunctionComponent<React.PropsWithChildren> = ({
	children,
}) => {
	return <AntdRegistry>{children}</AntdRegistry>;
};

export default AntdProvider;
