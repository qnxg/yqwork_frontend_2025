import type { IPermission } from "@/api/qnxg/permission";
import type { TreeNodeData } from "@douyinfe/semi-ui-19/lib/es/tree";

/** 权限标识的父节点： aaa:bbb:ccc -> aaa:bbb，aaa:bbb -> aaa，aaa -> null */
export function getParentPermission(permission: string): string | null {
	const lastColon = permission.lastIndexOf(":");
	if (lastColon === -1) return null;
	return permission.slice(0, lastColon);
}

/** 收集权限及其所有前缀（用于构建树），返回所有需展示的 permission 字符串 */
function collectAllKeys(list: IPermission[]): Set<string> {
	const keys = new Set<string>();
	for (const p of list) {
		let s: string | null = p.permission;
		while (s) {
			keys.add(s);
			s = getParentPermission(s);
		}
	}
	return keys;
}

export interface PermissionNodeData {
	/** 权限标识，作为树节点 key */
	permission: string;
	/** 显示名称（实际存在时为 name，虚节点为 permission） */
	name: string;
	/** 是否虚节点（逻辑上存在、数据库中不存在） */
	isVirtual: boolean;
	/** 实际权限 id，仅非虚节点有 */
	id?: number;
}

/** 由扁平权限列表构建「权限树」所需的结构：包含实际节点与虚节点 */
export function buildPermissionNodeMap(
	list: IPermission[],
): Map<string, PermissionNodeData> {
	const permissionById = new Map(list.map((p) => [p.permission, p]));
	const allKeys = collectAllKeys(list);
	const nodeMap = new Map<string, PermissionNodeData>();

	for (const key of allKeys) {
		const p = permissionById.get(key);
		nodeMap.set(key, {
			permission: key,
			name: p ? p.name : key,
			isVirtual: !p,
			id: p?.id,
		});
	}
	return nodeMap;
}

/** 扩展 TreeNodeData，挂载权限节点信息供 renderLabel 使用 */
export interface PermissionTreeNodeData extends TreeNodeData {
	permissionNode?: PermissionNodeData;
	children?: PermissionTreeNodeData[];
}

/** 将 nodeMap 转为 Semi Tree 的 treeData（按父节点归类，再递归成树） */
function buildTreeData(
	nodeMap: Map<string, PermissionNodeData>,
	parentKey: string | null,
): PermissionTreeNodeData[] {
	const items: PermissionTreeNodeData[] = [];
	for (const [key, data] of nodeMap) {
		if (getParentPermission(key) !== parentKey) continue;
		const sub = buildTreeData(nodeMap, key);
		items.push({
			key,
			label: data.name,
			value: key,
			permissionNode: data,
			children: sub.length > 0 ? sub : undefined,
		});
	}
	items.sort((a, b) => String(a.key).localeCompare(String(b.key)));
	return items;
}

export function permissionNodeMapToTreeData(
	nodeMap: Map<string, PermissionNodeData>,
): PermissionTreeNodeData[] {
	return buildTreeData(nodeMap, null);
}
