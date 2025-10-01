# 🧪 Como Testar as Etiquetas

## ✅ Implementação Completa

### O que foi adicionado ao FormularioPedidoCompra.tsx:

1. **Import do componente**:

   ```tsx
   import { ImprimirEtiquetas } from "./ImprimirEtiquetas";
   ```

2. **Estado para controlar visualização**:

   ```tsx
   const [mostrarEtiquetas, setMostrarEtiquetas] = useState(false);
   ```

3. **Botão "Imprimir Etiquetas"** (ao lado do botão Finalizar):
   - Aparece apenas para pedidos com status = 1 (finalizados)
   - Clique altera o estado para mostrar o componente de etiquetas

4. **Renderização condicional**:
   - Se `mostrarEtiquetas = true`: mostra o componente de etiquetas
   - Se `mostrarEtiquetas = false`: mostra o formulário normal

## 🚀 Como Testar

### Passo 1: Acessar um Pedido Finalizado

1. Navegue para `/pedidoCompra`
2. Clique em um pedido que tenha **status = 1** (finalizado)
3. Você verá dois botões no topo direito:
   - **"Finalizar Pedido"** (botão principal)
   - **"Imprimir Etiquetas"** (botão outline)

### Passo 2: Abrir Visualização de Etiquetas

1. Clique no botão **"Imprimir Etiquetas"**
2. O formulário será substituído pela visualização de etiquetas
3. Você verá:
   - Pré-visualização do PDF em tempo real
   - Botão "Baixar PDF" para download
   - Botão "Voltar" para retornar ao formulário

### Passo 3: Testar Funcionalidades

- **Visualizar PDF**: O PDF é renderizado automaticamente
- **Baixar PDF**: Clique em "Baixar PDF" para salvar o arquivo
- **Voltar**: Clique em "Voltar" para retornar ao formulário

## 📋 Dados Mockados Atuais

As etiquetas mostram dados de exemplo:

```typescript
[
	{
		produto: "Camisa Polo",
		cor: "Azul",
		tamanho: "M",
		codigo: "124-456",
		valor: "99,90",
	},
	{
		produto: "Calça Jeans",
		cor: "Preto",
		tamanho: "42",
		codigo: "456-789",
		valor: "149,90",
	},
	{
		produto: "Vestido Floral",
		cor: "Vermelho",
		tamanho: "P",
		codigo: "567-890",
		valor: "129,90",
	},
	{
		produto: "Blusa Manga Longa",
		cor: "Branco",
		tamanho: "G",
		codigo: "654-987",
		valor: "79,90",
	},
];
```

## 🔄 Fluxo de Navegação

```
FormularioPedidoCompra (visualização)
         ↓ (clique em "Imprimir Etiquetas")
    ImprimirEtiquetas
         ↓ (clique em "Voltar")
FormularioPedidoCompra (visualização)
```

## 🎯 Próximo Passo: Integração com Dados Reais

Para usar dados reais do pedido, modifique a linha 869-872:

```tsx
// Antes (dados mockados):
<ImprimirEtiquetas
  pedidoPublicId={pedidoPublicId || undefined}
  onClose={() => setMostrarEtiquetas(false)}
/>

// Depois (dados reais):
<ImprimirEtiquetas
  pedidoPublicId={pedidoPublicId || undefined}
  items={labelItems} // passar items do pedido
  onClose={() => setMostrarEtiquetas(false)}
/>
```

Onde `labelItems` seria criado a partir dos itens do pedido:

```tsx
const labelItems = selectedSkus.map(item => ({
	produto: item.product.nome,
	cor: item.sku.cor,
	tamanho: item.sku.tamanho,
	codigo: String(item.sku.id),
	valor: String(item.unitPrice),
}));
```

## ✨ Características Implementadas

- ✅ Botão de acesso no formulário
- ✅ Alternar entre formulário e etiquetas sem mudar de página
- ✅ Dados mockados para teste imediato
- ✅ Pré-visualização de PDF integrada
- ✅ Download de PDF funcional
- ✅ Botão voltar para retornar ao formulário
- ✅ Sem alterações no App.tsx (rotas)
- ✅ Componente isolado e reutilizável

---

**Status**: ✅ Pronto para teste  
**Data**: Setembro 2025
