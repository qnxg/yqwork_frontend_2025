import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@douyinfe/semi-ui-19",
		"@douyinfe/semi-icons",
		"@douyinfe/semi-illustrations",
	],
	async rewrites() {
		return [
			{
				source: "/upload/:path*",
				destination: "https://qnxg.cn/api/upload-2023/:path*",
			},
		];
	},
	output: "standalone",
};

export default nextConfig;
