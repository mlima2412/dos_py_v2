import { Produto } from "@/api-client";
import { CreateProdutoDto, UpdateProdutoDto } from "@/api-client";

export interface ProdutoFormData {
	nome: string;
	descricao: string;
	categoriaId: string;
	fornecedorId: string;
	currencyId: string;
	precoCompra: number;
	precoVenda: number;
	ativo: boolean;
	consignado: boolean;
	imgURL: string;
}

export const transformProdutoToForm = (produto: Produto): ProdutoFormData => ({
	nome: produto.nome || "",
	descricao: produto.descricao || "",
	categoriaId: produto.categoriaId ? String(produto.categoriaId) : "",
	fornecedorId: produto.fornecedorId ? String(produto.fornecedorId) : "",
	currencyId: produto.currencyId ? String(produto.currencyId) : "",
	precoCompra: produto.precoCompra || 0,
	precoVenda: produto.precoVenda || 0,
	ativo: produto.ativo ?? true,
	consignado: produto.consignado ?? false,
	imgURL: produto.imgURL || "",
});

export const transformFormToCreateProduto = (
	data: ProdutoFormData
): CreateProdutoDto => ({
	nome: data.nome,
	descricao: data.descricao || undefined,
	categoriaId: data.categoriaId ? Number(data.categoriaId) : undefined,
	fornecedorId: data.fornecedorId ? Number(data.fornecedorId) : undefined,
	currencyId: data.currencyId ? Number(data.currencyId) : undefined,
	precoCompra: data.precoCompra,
	precoVenda: data.precoVenda,
	ativo: data.ativo,
	consignado: data.consignado,
	imgURL: data.imgURL || undefined,
});

export const transformFormToUpdateProduto = (
	data: ProdutoFormData
): UpdateProdutoDto => ({
	nome: data.nome,
	descricao: data.descricao || undefined,
	categoriaId: data.categoriaId ? Number(data.categoriaId) : undefined,
	fornecedorId: data.fornecedorId ? Number(data.fornecedorId) : undefined,
	currencyId: data.currencyId ? Number(data.currencyId) : undefined,
	precoCompra: data.precoCompra,
	precoVenda: data.precoVenda,
	ativo: data.ativo,
	consignado: data.consignado,
	imgURL: data.imgURL || undefined,
});
