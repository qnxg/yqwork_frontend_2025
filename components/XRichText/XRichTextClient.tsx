import { useFieldApi } from "@douyinfe/semi-ui-19";
import { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { useEffect, useState } from "react";
import "./editor-view.css";
import { UPLOAD_SERVER_URL } from "@/config";

interface IEditorProps {
	/**
	 * 表单字段名，跟 Form.Item 的 field 一致
	 */
	field?: string;
	/**
	 * 表单字段值
	 */
	value?: string;
	/**
	 * 把 editor 实例暴露出去
	 */
	editorRef?: React.MutableRefObject<IDomEditor | null>;
	/**
	 * mounted之后的回调，一般懒加载后设置值时使用
	 */
	onLoaded?: () => void;
	className?: string;
}

const XRichText: React.FC<IEditorProps> = (props) => {
	const fieldApi = useFieldApi(props.field || "");

	// editor 实例
	const [editor, setEditor] = useState<IDomEditor | null>(null); // TS 语法
	// const [editor, setEditor] = useState(null)                   // JS 语法

	// 编辑器内容
	const [html, setHtml] = useState(props.value || ""); // TS 语法

	// 工具栏配置
	const toolbarConfig: Partial<IToolbarConfig> = {
		toolbarKeys: [
			"headerSelect",
			"bold",
			"underline",
			"italic",
			"clearStyle",
			"color",
			"bgColor",
			"fontSize",
			"indent",
			"lineHeight",
			"bulletedList",
			"numberedList",
			"insertTable",
			"justifyLeft",
			"justifyCenter",
			"justifyRight",
			{
				key: "image",
				title: "图片",
				menuKeys: [
					"insertImage",
					"uploadImage",
					"deleteImage",
					"editImage",
					// "viewImageLink",
					"imageWidth30",
					"imageWidth50",
					"imageWidth100",
				],
			},
			"fullScreen",
		],
	};

	// 编辑器配置
	const editorConfig: Partial<IEditorConfig> = {
		placeholder: "请输入内容...",
		MENU_CONF: {
			uploadImage: {
				server: `${UPLOAD_SERVER_URL}/editor-upload`,
				fieldName: "img",
				//TODO: 上传文件，子文件夹名字可以自定义
				meta: {
					subFolder: "editor-20240323",
				},
			},
		},
	};

	// 及时销毁 editor ，重要！
	useEffect(() => {
		if (fieldApi.getValue()) {
			setHtml(fieldApi.getValue());
		}
		return () => {
			if (editor == null) return;
			editor.destroy();
			setEditor(null);
		};
		// 原来就这么写的，能用，暂时不改了
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor]);

	// mounted之后的回调
	useEffect(() => {
		if (props.onLoaded) {
			props.onLoaded();
		}
		// 原来就这么写的，能用，暂时不改了
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 往外暴露的方法
	if (props.editorRef) {
		// 原来就这么写的，能用，暂时不改了
		props.editorRef.current = editor;
	}

	return (
		<div className={props.className}>
			{/* <Form.TextArea field='' {...props}  /> */}
			<div className="editor-view">
				<div style={{ border: "1px solid #ccc", zIndex: 100 }}>
					<Toolbar
						editor={editor}
						defaultConfig={toolbarConfig}
						mode="default"
						style={{ borderBottom: "1px solid #ccc" }}
					/>
					<Editor
						defaultConfig={editorConfig}
						value={html}
						onCreated={setEditor}
						onChange={(editor) => {
							const html = editor.getHtml();
							if (fieldApi) {
								fieldApi.setValue(html);
							}
							setHtml(html);
						}}
						mode="default"
						style={{ height: "500px", overflowY: "hidden" }}
					/>
				</div>
			</div>
		</div>
	);
};

export default XRichText;
