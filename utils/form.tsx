import { IconHelpCircle } from "@douyinfe/semi-icons";
import { Tooltip } from "@douyinfe/semi-ui-19";
import { LabelProps } from "@douyinfe/semi-ui-19/lib/es/form";

export const RequiredRule = { required: true, message: "此项为必填项" };
export const NumberRule = { type: "number", message: "请输入有效的数字" };

/**
 * 生成一个 Label Props，用于在表单的 Label 部分添加帮助信息
 */
export function labelWithHelp(label: string, help: string): LabelProps {
	return {
		text: label,
		extra: (
			<Tooltip content={help}>
				<IconHelpCircle
					style={{
						color: "var(--semi-color-text-2)",
					}}
				/>
			</Tooltip>
		),
	};
}

export const ZAIKU_HELP =
	"是否在 学工系统-学生资助 板块中申请 家庭经济困难学生认定 并完成入库流程";

export const QINGONGGANG_HELP =
	"是否在 学工系统-学生岗位申请 板块中申请 易千网络工作室助管 岗位并成功办结";
