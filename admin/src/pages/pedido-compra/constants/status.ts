export type OrderStatusKey = "pending" | "confirmed" | "delivered" | "cancelled";

export const STATUS_MAP: Record<number, OrderStatusKey> = {
	1: "pending",
	2: "confirmed",
	3: "delivered",
	4: "cancelled",
};

export const getStatusBadgeVariant = (status: OrderStatusKey) => {
	switch (status) {
		case "pending":
			return "secondary";
		case "confirmed":
		case "delivered":
			return "default";
		case "cancelled":
			return "destructive";
		default:
			return "secondary";
	}
};
