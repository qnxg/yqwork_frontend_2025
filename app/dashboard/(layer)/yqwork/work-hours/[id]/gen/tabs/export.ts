import { IResultViewDataItem } from "./FinalTab";
import { APP_URL } from "@/config";
import axios from "axios";

export const exportToExcel = async (viewData: IResultViewDataItem[]) => {
	const { Workbook } = await import("exceljs");

	// 请求模板
	const res = await axios.get(`${APP_URL}/muban.xlsx`, {
		responseType: "arraybuffer",
	});
	const mubanBuffer = res.data;

	// 1. 读取模板
	const workbook = new Workbook();
	await workbook.xlsx.load(mubanBuffer);
	// 复制一份模板
	const worksheet = workbook.getWorksheet(1);
	if (!worksheet) {
		console.error("模板文件格式错误");
		return;
	}

	// 2. 填充数据，从第4行开始
	let rowNumber = 4;
	worksheet.duplicateRow(rowNumber, viewData.length - 1, true);

	for (const item of viewData) {
		const {
			index,
			name,
			xueyuan,
			stuId,
			gangwei,
			workDescs,
			hourText,
			kaohe,
			comment,
			departmentText,
			totalWage,
		} = item;

		const row = worksheet.getRow(rowNumber);
		row.getCell(1).value = index;
		row.getCell(2).value = name;
		row.getCell(3).value = xueyuan;
		row.getCell(4).value = stuId;
		row.getCell(5).value = departmentText;
		row.getCell(6).value = gangwei;
		row.getCell(7).value = workDescs;
		row.getCell(8).value = hourText;
		row.getCell(9).value = kaohe;
		row.getCell(10).value = totalWage;
		row.getCell(11).value = comment;

		rowNumber++;
	}

	// 4. 合并单元格
	// const buffer1 = await workbook.xlsx.writeBuffer()
	// const workbook2 = await workbook.xlsx.load(buffer1)
	// const worksheet2 = workbook2.getWorksheet(1)

	// if (!worksheet2) {
	//     console.error('模板文件格式错误')
	//     return
	// }

	rowNumber = 4;
	for (const item of viewData) {
		const { rowSpan } = item;
		if (rowSpan > 1) {
			// console.log(`E${rowNumber}:E${rowNumber + rowSpan - 1}`)
			worksheet.mergeCells(`E${rowNumber}:E${rowNumber + rowSpan - 1}`);
		}
		rowNumber += rowSpan;
	}

	// 5. 导出
	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "工时表.xlsx";
	a.click();
	URL.revokeObjectURL(url);

	console.log("Done!");
};
