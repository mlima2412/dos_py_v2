import React from "react";
import { Button } from "@/components/ui/button";

interface PaginationLabels {
	showing: string;
	to: string;
	of: string;
	results: string;
	previous: string;
	next: string;
	page: string;
	ofWord: string;
}

interface PaginationBarProps {
	currentPage: number;
	totalPages: number;
	startIndex: number;
	endIndex: number;
	totalItems: number;
	onPageChange: (page: number) => void;
	labels: PaginationLabels;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
	currentPage,
	totalPages,
	startIndex,
	endIndex,
	totalItems,
	onPageChange,
	labels,
}) => {
	if (totalPages <= 1) {
		return null;
	}

	return (
		<div className="flex items-center justify-between mt-4">
			<div className="text-sm text-muted-foreground">
				{labels.showing} {startIndex + 1} {labels.to} {Math.min(endIndex, totalItems)} {labels.of} {totalItems} {labels.results}
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
				>
					{labels.previous}
				</Button>
				<span className="text-sm">
					{labels.page} {currentPage} {labels.ofWord} {totalPages}
				</span>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					{labels.next}
				</Button>
			</div>
		</div>
	);
};
