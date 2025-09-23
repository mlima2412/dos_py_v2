import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, User, MapPin, Calendar, Clock, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";
import type { LocalEstoque } from "@/api-client/types";

interface ConferenceHeaderProps {
	// Modo de edição
	isEditing: boolean;

	// Dados da conferência
	conferencia?: {
		id?: number;
		publicId?: string;
		status: string;
		localEstoqueId?: number;
		localNome?: string;
		Usuario?: any;
		dataInicio?: string;
		dataFim?: string;
	};

	// Dados para edição
	selectedLocal?: LocalEstoque | null;
	locais: LocalEstoque[];

	// Callbacks
	onLocalChange: (local: LocalEstoque | null) => void;
	onCreateConference: () => void;
	onBack?: () => void;

	// Estados de loading
	isCreating?: boolean;
	isUpdating?: boolean;
}

export const ConferenceHeader: React.FC<ConferenceHeaderProps> = ({
	isEditing,
	conferencia,
	selectedLocal,
	locais,
	onLocalChange,
	onCreateConference,
	onBack,
	isCreating = false,
	isUpdating = false,
}) => {
	const { t, i18n } = useTranslation("common");

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			const locale = i18n.language === "es" ? es : ptBR;
			return format(date, "dd/MM/yyyy HH:mm", { locale });
		} catch {
			return dateString;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "PENDENTE":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "EM_ANDAMENTO":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "FINALIZADA":
				return "bg-green-100 text-green-800 border-green-200";
			case "CANCELADA":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getStatusTranslation = (status: string) => {
		return t(`conference.status.${status}`);
	};

	if (isEditing) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						{t("conference.details.configureConference")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
						<div className="flex-1">
							<label className="text-sm font-medium mb-2 block">
								{t("conference.details.selectLocation")}
							</label>
							<Select
								value={selectedLocal?.id.toString() || ""}
								onValueChange={value => {
									const local = locais.find(l => l.id.toString() === value);
									onLocalChange(local || null);
								}}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("conference.details.selectLocation")}
									/>
								</SelectTrigger>
								<SelectContent>
									{locais.map(local => (
										<SelectItem key={local.id} value={local.id.toString()}>
											{local.nome}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							onClick={onCreateConference}
							disabled={!selectedLocal || isCreating}
							className="md:w-auto w-full"
						>
							<Play className="mr-2 h-4 w-4" />
							{isCreating
								? t("conference.details.creatingConference")
								: t("conference.details.createConference")}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!conferencia) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Package className="h-5 w-5" />
					{t("conference.details.conferenceInfo.title")}
					{onBack && (
						<Button
							variant="outline"
							size="sm"
							onClick={onBack}
							className="ml-auto"
						>
							{t("common.back")}
						</Button>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* Status */}
					<div className="flex items-center gap-2">
						<Badge className={getStatusColor(conferencia.status)}>
							{getStatusTranslation(conferencia.status)}
						</Badge>
					</div>

					{/* Local de Estoque */}
					<div className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">
								{t("conference.details.conferenceInfo.location")}
							</p>
							<p className="text-sm text-muted-foreground">
								{conferencia.localNome || "N/A"}
							</p>
						</div>
					</div>

					{/* Usuário Responsável */}
					<div className="flex items-center gap-2">
						<User className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">
								{t("conference.details.conferenceInfo.responsible")}
							</p>
							<p className="text-sm text-muted-foreground">
								{typeof conferencia.Usuario === "string"
									? conferencia.Usuario
									: (conferencia.Usuario as any)?.nome || "N/A"}
							</p>
						</div>
					</div>

					{/* Data de Início */}
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">
								{t("conference.details.conferenceInfo.startDate")}
							</p>
							<p className="text-sm text-muted-foreground">
								{conferencia.dataInicio
									? formatDate(conferencia.dataInicio)
									: "N/A"}
							</p>
						</div>
					</div>

					{/* Data de Fim */}
					{conferencia.dataFim && (
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">
									{t("conference.details.conferenceInfo.endDate")}
								</p>
								<p className="text-sm text-muted-foreground">
									{formatDate(conferencia.dataFim)}
								</p>
							</div>
						</div>
					)}

					{/* ID da Conferência */}
					<div className="flex items-center gap-2">
						<Package className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">
								{t("conference.details.conferenceInfo.id")}
							</p>
							<p className="text-sm text-muted-foreground font-mono">
								{conferencia.publicId}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
