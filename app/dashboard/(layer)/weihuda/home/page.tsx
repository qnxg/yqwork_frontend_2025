import { getStatisticsApi } from "@/api/qnxg/statistics";
import HomeIndex, { HomeIndexPayload } from "./HomeIndex";

export const dynamic = "force-dynamic";

export default async function Page() {
	const data = await getStatisticsApi();
	const payload: HomeIndexPayload = {
		data,
	};
	return <HomeIndex payload={payload} />;
}
