import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
	columns: number;
	rows?: number;
	message?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
	columns,
	rows = 5,
}) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					{Array.from({ length: columns }).map((_, index) => (
						<TableHead key={index}>
							<div className="h-4 bg-gray-200 rounded animate-pulse" />
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: rows }).map((_, rowIndex) => (
					<TableRow key={rowIndex}>
						{Array.from({ length: columns }).map((_, colIndex) => (
							<TableCell key={colIndex}>
								<div className="h-4 bg-gray-100 rounded animate-pulse" />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

// Componente simples para mensagem de carregamento
export const LoadingMessage: React.FC<{
	columns: number;
	message: string;
}> = ({ columns, message }) => (
	<TableRow>
		<TableCell colSpan={columns} className="h-24 text-center">
			{message}
		</TableCell>
	</TableRow>
);
