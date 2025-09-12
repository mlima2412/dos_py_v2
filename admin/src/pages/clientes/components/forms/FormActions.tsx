import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface FormActionsProps {
	isViewing: boolean;
	isSubmitting: boolean;
	isEditing: boolean;
}

export const FormActions = ({
	isViewing,
	isSubmitting,
	isEditing,
}: FormActionsProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className="flex justify-end space-x-4">
			<Button
				type="button"
				variant="outline"
				onClick={() => navigate("/clientes")}
			>
				<X className="mr-2 h-4 w-4" />
				{isViewing ? t("common.close") : t("common.cancel")}
			</Button>
			{!isViewing && (
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<Spinner size="sm" className="mr-2" />
							{isEditing ? t("common.updating") : t("common.creating")}
						</>
					) : (
						<>
							<Save className="mr-2 h-4 w-4" />
							{isEditing ? t("common.update") : t("common.create")}
						</>
					)}
				</Button>
			)}
		</div>
	);
};
