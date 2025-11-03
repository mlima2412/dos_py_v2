import type { PedidoCompraStatusEnumKey } from "@/api-client/types";
import { STATUS_MAP, type OrderStatusKey } from "../constants/status";

export const mapStatusToKey = (
	status?: PedidoCompraStatusEnumKey | number | null
): OrderStatusKey => {
	if (status === null || status === undefined) {
		return "pending";
	}

	const normalized = typeof status === "number" ? status : Number(status);
	return STATUS_MAP[normalized] ?? "pending";
};
