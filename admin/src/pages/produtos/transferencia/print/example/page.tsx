"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useAPI from "@/hooks/useAPI";
import Spinner from "@/components/shared/Spinner";
import PedidoVendaPDF, { PedidoPrint } from "./pedidoVendaLayout";

export default function PedidosCompraPDF() {
	const { id } = useParams();
	const { httpGet } = useAPI();
	const [pedidoData, setPedidoData] = useState<
		Partial<PedidoPrint> | undefined
	>(undefined);
	const [loading, setLoading] = useState(true); // loading state
	const isMounted = useRef(false); // Ref para evitar múltiplas execuções

	async function esperar(tempo: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, tempo);
		});
	}

	useEffect(() => {
		const fetchVenda = async () => {
			try {
				const result = await httpGet(`venda/${id}`);
				return result;
			} catch (error) {
				console.error("Erro ao buscar pedido:", error);
			}
		};

		const fetchItens = async () => {
			try {
				const result = await httpGet(`venda-itens/${id}/venda`);
				return result;
			} catch (error) {
				console.error("Erro ao buscar itens do pedido:", error);
			}
		};

		const fetchData = async () => {
			if (isMounted.current) return;
			isMounted.current = true;

			try {
				console.log("Buscando venda...");
				setLoading(true);
				const venda = await fetchVenda();
				const itens = await fetchItens();
				await esperar(2000);

				interface Produto {
					id: number;
					idVariante: number;
					nome: string;
				}

				interface ProdutoVariante {
					id: number;
					produto: Produto;
					cor: string;
					tamanho: string;
				}

				interface ItemVenda {
					idVendaItem: number;
					qtd: number;
					precoVenda: number;
					produtoVariante: ProdutoVariante;
				}

				const itensVenda: ItemVenda[] = itens.map((item: ItemVenda) => ({
					produto: {
						idProduto: item.produtoVariante.produto.id,
						idVariante: item.produtoVariante.id,
						nome: item.produtoVariante.produto.nome,
					},
					cor: item.produtoVariante.cor,
					tamanho: item.produtoVariante.tamanho,
					qtd: item.qtd,
					precoVenda: item.precoVenda,
				}));

				setPedidoData({
					...venda,
					itensVenda,
				});
			} catch (error) {
				setPedidoData(undefined);
				setLoading(false);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [httpGet, id, setPedidoData]);

	if (loading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<Spinner
					texto='Buscando dados do pedido...'
					size='medium'
				/>
			</div>
		); // Exibe um indicador de carregamento
	}

	if (!pedidoData) {
		return <div>Erro ao carregar os dados do pedido.</div>; // Exibe mensagem de erro se não houver dados
	}

	return <PedidoVendaPDF {...(pedidoData as PedidoPrint)} />;
}
