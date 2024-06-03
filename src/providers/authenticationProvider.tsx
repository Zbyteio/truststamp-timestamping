"use client";
import { Spin } from "antd";
import { redirect } from "next/navigation";

import React from "react";

const AuthenticationProvider: React.FunctionComponent<
React.PropsWithChildren
> = ({ children }) => {
	const status = "loading";

	//if (status === "loading") redirect("/login");

	return (
		<React.Fragment>
			{status !== "loading" ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: 1,
						height: "100%",
					}}
				>
					<Spin />
				</div>
			) : (
			children
			)}
		</React.Fragment>
	);
};

export default AuthenticationProvider;
