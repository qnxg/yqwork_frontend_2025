import dynamic from "next/dynamic";

const XRichText = dynamic(
	() => import("@/components/XRichText/XRichTextClient"),
	{ ssr: false, loading: () => <div>加载中...</div> },
);

export default XRichText;
