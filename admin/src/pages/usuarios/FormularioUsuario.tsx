import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Save, X, Plus, Trash2 } from "lucide-react";

import {
	useUsuariosControllerFindOne,
	usuariosControllerCreate,
	usuariosControllerUpdate,
	usuarioParceiroControllerCreate,
	usuarioParceiroControllerRemove,
} from "@/api-client";
import { useProfiles } from "@/hooks/useProfiles";
import { useParceirosAll } from "@/hooks/useParceiros";
import { useToast } from "@/hooks/useToast";
import { type UsuarioWithRelations } from "@/hooks/useUsers";

// Tipo para associação parceiro-perfil
interface ParceiroPerfilAssociation {
	id?: number; // ID da relação UsuarioParceiro (para edição)
	parceiroId: string;
	perfilId: string;
	parceiro?: { id: number; nome: string };
	perfil?: { id: number; nome: string };
}

// Schema de validação com i18n
const createUserSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
	z.object({
		nome: z
			.string()
			.min(1, t("validation.required", { field: t("users.name") }))
			.min(2, t("validation.minLength", { field: t("users.name"), min: 2 })),
		email: z
			.string()
			.min(1, t("validation.required", { field: t("users.email") }))
			.email(t("validation.email")),
		telefone: z.string().optional(),
	});

const updateUserSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
	z.object({
		nome: z
			.string()
			.min(1, t("validation.required", { field: t("users.name") }))
			.min(2, t("validation.minLength", { field: t("users.name"), min: 2 })),
		email: z
			.string()
			.min(1, t("validation.required", { field: t("users.email") }))
			.email(t("validation.email")),
		telefone: z.string().optional(),
	});

type CreateUserFormData = z.infer<ReturnType<typeof createUserSchema>>;
type UpdateUserFormData = z.infer<ReturnType<typeof updateUserSchema>>;
type FormData = CreateUserFormData | UpdateUserFormData;

// Usando UsuarioWithRelations do hook useUsers

export function FormularioUsuario() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { publicId } = useParams<{ publicId?: string }>();
	const toast = useToast();
	const queryClient = useQueryClient();

	const isEditing = Boolean(publicId);
	const schema = isEditing ? updateUserSchema(t) : createUserSchema(t);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			nome: "",
			email: "",
			telefone: "",
		},
	});

	// Estado para gerenciar associações parceiro-perfil
	const [associations, setAssociations] = useState<ParceiroPerfilAssociation[]>(
		[]
	);
	const [newAssociation, setNewAssociation] = useState<
		Omit<ParceiroPerfilAssociation, "id">
	>({ parceiroId: "", perfilId: "" });
	const [associationErrors, setAssociationErrors] = useState<string>("");

	// Estado para seleção inicial de parceiro (apenas para criação)
	const [initialPartner, setInitialPartner] = useState<string>("");
	const [initialProfile, setInitialProfile] = useState<string>("");

	// Buscar dados do usuário para edição
	const { data: userData, isLoading: isLoadingUser } =
		useUsuariosControllerFindOne(publicId || "", {
			query: {
				enabled: isEditing && !!publicId,
			},
		}) as { data: UsuarioWithRelations | undefined; isLoading: boolean };

	// Buscar perfis
	const { data: profiles, isLoading: isLoadingProfiles } = useProfiles();

	// Buscar todos os parceiros
	const { data: parceiros, isLoading: isLoadingParceiros } = useParceirosAll();

	// Preencher formulário com dados do usuário
	useEffect(() => {
		if (userData && isEditing) {
			const formData = {
				nome: userData.nome || "",
				email: userData.email || "",
				telefone: userData.telefone || "",
			};

			reset(formData);

			// Carregar associações existentes
			if (userData.UsuarioParceiro && userData.UsuarioParceiro.length > 0) {
				const existingAssociations = userData.UsuarioParceiro.map(up => ({
					id: up.id,
					parceiroId: up.Parceiro?.id?.toString() || "",
					perfilId: up.perfilId?.toString() || "",
					parceiro: up.Parceiro,
					perfil: up.perfil, // Usando perfil conforme definido no tipo UsuarioParceiro
				}));
				setAssociations(existingAssociations);
			}
		}
	}, [userData, isEditing, reset]);

	// Funções para gerenciar associações
	// Mutation para adicionar associação imediatamente
	const addAssociationMutation = useMutation({
		mutationFn: async () => {
			if (!userData?.id) throw new Error("Usuário não encontrado");

			return await usuarioParceiroControllerCreate({
				usuarioId: userData.id,
				parceiroId: parseInt(newAssociation.parceiroId),
				perfilId: parseInt(newAssociation.perfilId),
			});
		},
		onSuccess: response => {
			toast.success("Associação adicionada com sucesso");

			// Adicionar a nova associação ao estado local imediatamente
			const parceiro = parceiros?.find(
				p => p.id.toString() === newAssociation.parceiroId
			);
			const perfil = profiles?.find(
				p => p.id.toString() === newAssociation.perfilId
			);

			setAssociations(prev => [
				...prev,
				{
					id: response.id,
					parceiroId: newAssociation.parceiroId,
					perfilId: newAssociation.perfilId,
					parceiro: parceiro
						? { id: parceiro.id, nome: parceiro.nome }
						: undefined,
					perfil: perfil ? { id: perfil.id, nome: perfil.nome } : undefined,
				},
			]);

			setNewAssociation({ parceiroId: "", perfilId: "" });
			setAssociationErrors("");
			// Invalidar queries para recarregar dados
			queryClient.invalidateQueries({ queryKey: ["usuarios", publicId] });
		},
		onError: (error: Error) => {
			console.error("Erro ao adicionar associação:", error);
			toast.error(error.message || "Erro ao adicionar associação");
		},
	});

	// Mutation para remover associação imediatamente
	const removeAssociationMutation = useMutation({
		mutationFn: async (associationId: number) => {
			console.log("Removendo associação com ID:", associationId);
			return await usuarioParceiroControllerRemove(associationId);
		},
		onSuccess: (_, associationId) => {
			toast.success("Associação removida com sucesso");

			// Remover a associação do estado local imediatamente
			setAssociations(prev => prev.filter(assoc => assoc.id !== associationId));

			// Invalidar queries para recarregar dados
			queryClient.invalidateQueries({ queryKey: ["usuarios", publicId] });
		},
		onError: (error: Error) => {
			console.error("Erro ao remover associação:", error);
			toast.error(error.message || "Erro ao remover associação");
		},
	});

	const addAssociation = () => {
		if (!newAssociation.parceiroId || !newAssociation.perfilId) {
			setAssociationErrors("Selecione um parceiro e um perfil");
			return;
		}

		// Verificar se a associação já existe
		const exists = associations.some(
			a =>
				a.parceiroId === newAssociation.parceiroId &&
				a.perfilId === newAssociation.perfilId
		);

		if (exists) {
			setAssociationErrors("Esta associação já existe");
			return;
		}

		if (!isEditing) {
			// Para criação, apenas adicionar ao estado local
			const parceiro = parceiros?.find(
				p => p.id.toString() === newAssociation.parceiroId
			);
			const perfil = profiles?.find(
				p => p.id.toString() === newAssociation.perfilId
			);

			setAssociations(prev => [
				...prev,
				{
					...newAssociation,
					parceiro: parceiro
						? { id: parceiro.id, nome: parceiro.nome }
						: undefined,
					perfil: perfil ? { id: perfil.id, nome: perfil.nome } : undefined,
				},
			]);

			setNewAssociation({ parceiroId: "", perfilId: "" });
			setAssociationErrors("");
		} else {
			// Para edição, adicionar imediatamente no banco
			addAssociationMutation.mutate();
		}
	};

	const removeAssociation = (index: number) => {
		const association = associations[index];

		if (!isEditing || !association.id) {
			// Para criação ou associações sem ID, apenas remover do estado local
			setAssociations(prev => prev.filter((_, i) => i !== index));
		} else {
			// Para edição, remover imediatamente do banco
			removeAssociationMutation.mutate(association.id);
		}
	};

	// Mutation para criar usuário
	const createUserMutation = useMutation({
		mutationFn: async (data: CreateUserFormData) => {
			// Validar se há parceiro e perfil selecionados
			if (!initialPartner || !initialProfile) {
				throw new Error("É necessário selecionar um parceiro e um perfil");
			}

			// Criar o usuário
			const userResponse = await usuariosControllerCreate({
				nome: data.nome,
				email: data.email,
				telefone: data.telefone || undefined,
			});

			// Criar a relação inicial UsuarioParceiro
			await usuarioParceiroControllerCreate({
				usuarioId: (userResponse as { id: number }).id,
				parceiroId: parseInt(initialPartner),
				perfilId: parseInt(initialProfile),
			});

			return userResponse;
		},
		onSuccess: () => {
			toast.success(t("users.messages.createSuccess"));
			navigate("/usuarios");
		},
		onError: (error: Error) => {
			toast.error(error.message || t("users.messages.createError"));
		},
	});

	// Mutation para atualizar usuário (apenas dados básicos)
	const updateUserMutation = useMutation({
		mutationFn: async (data: UpdateUserFormData) => {
			if (!publicId) throw new Error("ID do usuário não encontrado");

			// Atualizar apenas dados básicos do usuário
			const response = await usuariosControllerUpdate(publicId, {
				publicId: publicId,
				nome: data.nome,
				email: data.email,
				telefone: data.telefone || undefined,
			});

			return response;
		},
		onSuccess: () => {
			toast.success(t("users.messages.updateSuccess"));
			navigate("/usuarios");
		},
		onError: (error: Error) => {
			toast.error(error.message || t("users.messages.updateError"));
		},
	});

	const onSubmit = (data: FormData) => {
		if (isEditing) {
			updateUserMutation.mutate(data as UpdateUserFormData);
		} else {
			createUserMutation.mutate(data as CreateUserFormData);
		}
	};

	const isLoading = isLoadingUser || isLoadingProfiles || isLoadingParceiros;
	const isSaving = createUserMutation.isPending || updateUserMutation.isPending;

	if (isLoading) {
		return (
			
				<div className="flex items-center justify-center min-h-[400px]">
					<Spinner size="lg" />
				</div>
			
		);
	}

	return (
		
			<div className="space-y-6">
				{/* Breadcrumb */}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">{t("navigation.home")}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/usuarios">
								{t("users.title")}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{isEditing ? t("users.edit") : t("users.create")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Formulário */}
				<Card>
					<CardHeader>
						<CardTitle>
							{isEditing ? t("users.edit") : t("users.create")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							{/* Primeira Row: Nome, Email, Telefone */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{/* Nome */}
								<div className="space-y-2">
									<Label htmlFor="nome">{t("users.name")} *</Label>
									<Input
										id="nome"
										{...register("nome")}
										placeholder={t("users.namePlaceholder")}
										className={errors.nome ? "border-destructive" : ""}
									/>
									{errors.nome && (
										<p className="text-sm text-destructive">
											{errors.nome.message}
										</p>
									)}
								</div>

								{/* Email */}
								<div className="space-y-2">
									<Label htmlFor="email">{t("users.email")} *</Label>
									<Input
										id="email"
										type="email"
										{...register("email")}
										placeholder={t("users.emailPlaceholder")}
										className={errors.email ? "border-destructive" : ""}
									/>
									{errors.email && (
										<p className="text-sm text-destructive">
											{errors.email.message}
										</p>
									)}
								</div>

								{/* Telefone */}
								<div className="space-y-2">
									<Label htmlFor="telefone">{t("users.phone")}</Label>
									<Input
										id="telefone"
										{...register("telefone")}
										placeholder={t("users.phonePlaceholder")}
									/>
								</div>
							</div>

							{/* Seção de Associações Parceiro-Perfil */}
							{!isEditing ? (
								/* Interface simplificada para criação */
								<div className="space-y-4">
									<div className="border-t pt-6">
										<h3 className="text-lg font-medium">
											{t("users.initialPartnerProfile", {
												defaultValue: "Parceiro e Perfil Inicial",
											})}
										</h3>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											{/* Seleção de Parceiro */}
											<div className="space-y-2">
												<Label>{t("partners.title")} *</Label>
												<Select
													value={initialPartner}
													onValueChange={value => setInitialPartner(value)}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={t("users.selectPartner", {
																defaultValue: "Selecione um parceiro",
															})}
														/>
													</SelectTrigger>
													<SelectContent>
														{parceiros?.map(parceiro => (
															<SelectItem
																key={parceiro.id}
																value={parceiro.id.toString()}
															>
																{parceiro.nome}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* Seleção de Perfil */}
											<div className="space-y-2">
												<Label>
													{t("profiles.title", { defaultValue: "Perfil" })} *
												</Label>
												<Select
													value={initialProfile}
													onValueChange={value => setInitialProfile(value)}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={t("users.selectProfile", {
																defaultValue: "Selecione um perfil",
															})}
														/>
													</SelectTrigger>
													<SelectContent>
														{profiles?.map(profile => (
															<SelectItem
																key={profile.id}
																value={profile.id.toString()}
															>
																{profile.nome}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										{/* Mensagem informativa */}
										<p className="text-sm text-muted-foreground">
											{t("users.initialPartnerInfo", {
												defaultValue:
													"Selecione um parceiro e perfil inicial. Você poderá adicionar mais associações após criar o usuário.",
											})}
										</p>
									</div>
								</div>
							) : (
								/* Interface completa para edição */
								<div className="space-y-4">
									<div className="border-t pt-6">
										<h3 className="text-lg font-medium">
											{t("partners.title", { defaultValue: "Parceiros" })}
										</h3>

										{/* Lista de associações existentes */}
										{associations.length > 0 && (
											<div className="space-y-3 mb-6">
												<Label>
													{t("users.existingAssociations", {
														defaultValue: "Associações existentes",
													})}
													:
												</Label>
												<div className="space-y-2">
													{associations.map((association, index) => (
														<div
															key={index}
															className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
														>
															<div className="flex items-center space-x-3">
																<Badge variant="outline">
																	{association.parceiro?.nome ||
																		parceiros?.find(
																			p =>
																				p.id.toString() ===
																				association.parceiroId
																		)?.nome}
																</Badge>
																<span className="text-muted-foreground">→</span>
																<Badge variant="secondary">
																	{association.perfil?.nome ||
																		profiles?.find(
																			p =>
																				p.id.toString() === association.perfilId
																		)?.nome}
																</Badge>
															</div>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => removeAssociation(index)}
																className="text-destructive hover:text-destructive"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Formulário para adicionar nova associação */}
										<div className="space-y-4 p-4 border rounded-lg bg-background">
											<div className="flex items-center justify-between">
												<Label>
													{t("partners.title")}{" "}
													{t("common.available", {
														defaultValue: "disponíveis",
													})}
													:
												</Label>
												<Button
													type="button"
													onClick={addAssociation}
													size="sm"
													disabled={
														!newAssociation.parceiroId ||
														!newAssociation.perfilId
													}
												>
													<Plus className="mr-2 h-4 w-4" />
													{t("common.add", { defaultValue: "Adicionar" })}
												</Button>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{/* Seleção de Parceiro */}
												<div className="space-y-2">
													<Label>{t("partners.title")} *</Label>
													<Select
														value={newAssociation.parceiroId}
														onValueChange={value => {
															setNewAssociation(prev => ({
																...prev,
																parceiroId: value,
															}));
															setAssociationErrors("");
														}}
													>
														<SelectTrigger>
															<SelectValue
																placeholder={t("users.selectPartner", {
																	defaultValue: "Selecione um parceiro",
																})}
															/>
														</SelectTrigger>
														<SelectContent>
															{parceiros
																?.filter(
																	parceiro =>
																		!associations.some(
																			assoc =>
																				assoc.parceiroId ===
																				parceiro.id.toString()
																		)
																)
																.map(parceiro => (
																	<SelectItem
																		key={parceiro.id}
																		value={parceiro.id.toString()}
																	>
																		{parceiro.nome}
																	</SelectItem>
																))}
														</SelectContent>
													</Select>
												</div>

												{/* Seleção de Perfil */}
												<div className="space-y-2">
													<Label>
														{t("profiles.title", { defaultValue: "Perfil" })} *
													</Label>
													<Select
														value={newAssociation.perfilId}
														onValueChange={value => {
															setNewAssociation(prev => ({
																...prev,
																perfilId: value,
															}));
															setAssociationErrors("");
														}}
													>
														<SelectTrigger>
															<SelectValue
																placeholder={t("users.selectProfile", {
																	defaultValue: "Selecione um perfil",
																})}
															/>
														</SelectTrigger>
														<SelectContent>
															{profiles?.map(profile => (
																<SelectItem
																	key={profile.id}
																	value={profile.id.toString()}
																>
																	{profile.nome}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</div>

											{/* Erro de validação */}
											{associationErrors && (
												<p className="text-sm text-destructive">
													{associationErrors}
												</p>
											)}

											{/* Mensagem informativa */}
											{associations.length === 0 && (
												<p className="text-sm text-muted-foreground">
													{t("users.associationRequired", {
														defaultValue:
															"É necessário adicionar pelo menos uma associação parceiro-perfil.",
													})}
												</p>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Botões */}
							<div className="flex justify-end space-x-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => navigate("/usuarios")}
									disabled={isSaving}
								>
									<X className="mr-2 h-4 w-4" />
									{t("common.cancel")}
								</Button>
								<Button type="submit" disabled={isSaving}>
									{isSaving ? (
										<Spinner size="sm" className="mr-2" />
									) : (
										<Save className="mr-2 h-4 w-4" />
									)}
									{isEditing ? t("common.update") : t("common.create")}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		
	);
}
