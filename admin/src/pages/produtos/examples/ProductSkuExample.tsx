import React, { useState } from "react";
import { ProductListing } from "../components/ProductListing";
import { SkuListing } from "../components/SkuListing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type {
	ProdutosPorLocalResponseDto,
	ProdutoSKUEstoqueResponseDto,
} from "@/api-client/types";

/**
 * Exemplo de como usar os componentes ProductListing e SkuListing
 * em outros lugares da aplicação
 */
export const ProductSkuExample: React.FC = () => {
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null
	);

	// Dados de exemplo (em uma aplicação real, estes viriam de uma API)
	const products: ProdutosPorLocalResponseDto[] = [
		{
			id: 1,
			publicId: "prod-1",
			nome: "Camiseta Básica",
			precoVenda: 29.9,
			precoCompra: 15.0,
			ativo: true,
			consignado: false,
			categoria: { id: 1, descricao: "Roupas" },
			ProdutoSKU: [
				{
					id: 1,
					publicId: "sku-1",
					cor: "Azul",
					codCor: 0x0000ff,
					tamanho: "M",
					estoque: 10,
					qtdMinima: 5,
				},
				{
					id: 2,
					publicId: "sku-2",
					cor: "Vermelho",
					codCor: 0xff0000,
					tamanho: "G",
					estoque: 3,
					qtdMinima: 5,
				},
			],
		},
		{
			id: 2,
			publicId: "prod-2",
			nome: "Calça Jeans",
			precoVenda: 89.9,
			precoCompra: 45.0,
			ativo: true,
			consignado: false,
			categoria: { id: 1, descricao: "Roupas" },
			ProdutoSKU: [
				{
					id: 3,
					publicId: "sku-3",
					cor: "Azul",
					codCor: 0x0000ff,
					tamanho: "38",
					estoque: 15,
					qtdMinima: 8,
				},
			],
		},
	];

	// Encontrar o produto selecionado
	const selectedProduct =
		products.find(
			(produto: ProdutosPorLocalResponseDto) => produto.id === selectedProductId
		) || null;

	// Obter SKUs do produto selecionado
	const selectedProductSkus: ProdutoSKUEstoqueResponseDto[] =
		selectedProduct?.ProdutoSKU || [];

	// Função para lidar com ajuste de estoque (opcional)
	const handleStockAdjust = (sku: ProdutoSKUEstoqueResponseDto) => {
		console.log("Ajustar estoque do SKU:", sku);
		// Implementar lógica de ajuste de estoque aqui
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Exemplo de Uso dos Componentes</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Este exemplo mostra como usar os componentes ProductListing e
						SkuListing em outros lugares da aplicação.
					</p>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Listagem de Produtos - sempre habilitada */}
				<ProductListing
					products={products}
					selectedProductId={selectedProductId}
					onProductSelect={setSelectedProductId}
					isLoading={false}
					error={null}
				/>

				{/* Listagem de SKUs - com ajuste de estoque habilitado */}
				<SkuListing
					selectedProduct={selectedProduct}
					selectedProductId={selectedProductId}
					skus={selectedProductSkus}
					isLoading={false}
					error={null}
					enableStockAdjustment={true}
					onStockAdjust={handleStockAdjust}
				/>
			</div>

			{/* Exemplo de uso sem ajuste de estoque */}
			<Card>
				<CardHeader>
					<CardTitle>Exemplo sem Ajuste de Estoque</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<ProductListing
							products={products}
							selectedProductId={selectedProductId}
							onProductSelect={setSelectedProductId}
							isLoading={false}
							error={null}
						/>

						<SkuListing
							selectedProduct={selectedProduct}
							selectedProductId={selectedProductId}
							skus={selectedProductSkus}
							isLoading={false}
							error={null}
							enableStockAdjustment={false}
							// onStockAdjust não é necessário quando enableStockAdjustment é false
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
