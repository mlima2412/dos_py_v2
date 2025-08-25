import { useUserParceiros } from "@/hooks/useUserParceiros";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, User } from "lucide-react";

/**
 * Componente que exibe os parceiros do usuário logado
 */
export function UserParceiros() {
	const { parceiros, isLoading, error } = useUserParceiros();

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center p-6">
					<Loader2 className="h-6 w-6 animate-spin" />
					<span className="ml-2">Carregando parceiros...</span>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-red-600">
						Erro ao carregar parceiros: {String(error) || "Erro desconhecido"}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!parceiros || parceiros.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5" />
						Meus Parceiros
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Você não está associado a nenhum parceiro.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Building2 className="h-5 w-5" />
					Meus Parceiros ({parceiros.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{parceiros.map(item => (
						<div
							key={item.id}
							className="flex items-center justify-between p-4 border rounded-lg"
						>
							<div className="flex items-center gap-3">
								{item.Parceiro?.logourl ? (
									<img
										src={item.Parceiro.logourl}
										alt={`Logo ${item.Parceiro.nome}`}
										className="h-10 w-10 rounded-full object-cover"
									/>
								) : (
									<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
										<Building2 className="h-5 w-5 text-gray-500" />
									</div>
								)}
								<div>
									<h3 className="font-medium">{item.Parceiro?.nome}</h3>
									<p className="text-sm text-muted-foreground">
										ID: {item.Parceiro?.publicId}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="flex items-center gap-1">
									<User className="h-3 w-3" />
									{item.perfil?.nome}
								</Badge>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export default UserParceiros;
