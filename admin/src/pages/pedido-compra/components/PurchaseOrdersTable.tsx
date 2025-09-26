import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Printer, Trash2 } from "lucide-react";
import { getStatusBadgeVariant } from "../constants/status";
import type { PurchaseOrderListItem, OrderStatusKey } from "../types";

interface ColumnLabels {
	supplier: string;
	orderDate: string;
	purchaseValue: string;
	payableValue: string;
	status: string;
	actions: string;
}

interface ActionLabels {
	view: string;
	print: string;
	delete: string;
	deleteConfirmTitle: string;
	deleteConfirmDescription: string;
	deleteConfirmCancel: string;
	deleteConfirmConfirm: string;
}

interface PurchaseOrdersTableProps {
	orders: PurchaseOrderListItem[];
	formatPurchaseValue: (order: PurchaseOrderListItem) => string;
	formatPayableValue: (order: PurchaseOrderListItem) => string;
	formatDate: (value: string) => string;
	getStatusLabel: (status: OrderStatusKey) => string;
	onView: (publicId: string) => void;
	onPrint: (publicId: string) => void;
	onDelete: (publicId: string) => void;
	deletingOrderId: string | null;
	isDeleting: boolean;
	columns: ColumnLabels;
	actions: ActionLabels;
}

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
	orders,
	formatPurchaseValue,
	formatPayableValue,
	formatDate,
	getStatusLabel,
	onView,
	onPrint,
	onDelete,
	deletingOrderId,
	isDeleting,
	columns,
	actions,
}) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>{columns.supplier}</TableHead>
					<TableHead className="text-center">{columns.orderDate}</TableHead>
					<TableHead className="text-right">{columns.purchaseValue}</TableHead>
					<TableHead className="text-right">{columns.payableValue}</TableHead>
					<TableHead>{columns.status}</TableHead>
					<TableHead className="w-24">{columns.actions}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{orders.map(order => (
					<TableRow key={order.publicId} className="group">
						<TableCell className="font-medium">{order.supplierName}</TableCell>
						<TableCell className="text-center">
							{order.dataPedido ? formatDate(order.dataPedido) : "-"}
						</TableCell>
						<TableCell className="text-right font-medium">
							{formatPurchaseValue(order)}
						</TableCell>
						<TableCell className="text-right font-medium">
							{formatPayableValue(order)}
						</TableCell>
						<TableCell>
							<Badge variant={getStatusBadgeVariant(order.status)}>
								{getStatusLabel(order.status)}
							</Badge>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onView(order.publicId)}
									title={actions.view}
								>
									<Eye className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onPrint(order.publicId)}
									title={actions.print}
								>
									<Printer className="h-4 w-4" />
								</Button>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											title={actions.delete}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												{actions.deleteConfirmTitle}
											</AlertDialogTitle>
											<AlertDialogDescription>
												{actions.deleteConfirmDescription}
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>
												{actions.deleteConfirmCancel}
											</AlertDialogCancel>
											<AlertDialogAction
												onClick={() => onDelete(order.publicId)}
												disabled={
													isDeleting && deletingOrderId === order.publicId
												}
											>
												{actions.deleteConfirmConfirm}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
