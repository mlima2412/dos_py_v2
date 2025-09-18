# Módulo de Produtos

Este módulo contém todas as funcionalidades relacionadas a produtos, incluindo categorias, estoques e componentes reutilizáveis.

## Estrutura de Pastas

```
produtos/
├── components/           # Componentes reutilizáveis
│   ├── ProductListing.tsx    # Listagem de produtos
│   └── SkuListing.tsx        # Listagem de SKUs
├── categorias/          # Categorias de produtos
├── estoques/            # Gestão de estoques
│   ├── components/      # Componentes específicos de estoque
│   ├── VisualizarEstoque.tsx
│   └── ...
├── examples/            # Exemplos de uso
│   └── ProductSkuExample.tsx
└── produtos/            # Produtos principais
```

## Componentes Reutilizáveis

### ProductListing

Componente para listagem de produtos com filtros por busca e categoria.

**Props:**

- `products`: Array de produtos
- `selectedProductId`: ID do produto selecionado
- `onProductSelect`: Callback para seleção de produto
- `isLoading`: Estado de carregamento
- `error`: Erro da requisição

### SkuListing

Componente para listagem de SKUs com filtros por busca e tamanho.

**Props:**

- `selectedProduct`: Produto selecionado
- `selectedProductId`: ID do produto selecionado
- `skus`: Array de SKUs
- `isLoading`: Estado de carregamento
- `error`: Erro da requisição
- `enableStockAdjustment`: Flag para habilitar ajuste de estoque (opcional)
- `onStockAdjust`: Callback para ajuste de estoque (opcional)

## Exemplo de Uso

```tsx
import { ProductListing } from "./components/ProductListing";
import { SkuListing } from "./components/SkuListing";

// Com ajuste de estoque habilitado
<ProductListing
  products={products}
  selectedProductId={selectedProductId}
  onProductSelect={setSelectedProductId}
  isLoading={isLoading}
  error={error}
/>

<SkuListing
  selectedProduct={selectedProduct}
  selectedProductId={selectedProductId}
  skus={selectedProductSkus}
  isLoading={isLoading}
  error={error}
  enableStockAdjustment={true}
  onStockAdjust={handleStockAdjust}
/>

// Sem ajuste de estoque (apenas visualização)
<SkuListing
  selectedProduct={selectedProduct}
  selectedProductId={selectedProductId}
  skus={selectedProductSkus}
  isLoading={isLoading}
  error={error}
  enableStockAdjustment={false}
/>
```

## Migração

A pasta `estoques` foi movida de `/pages/estoques` para `/pages/produtos/estoques` para manter todas as funcionalidades relacionadas a produtos no mesmo local.

As rotas continuam funcionando normalmente através do App.tsx que foi atualizado para apontar para o novo caminho.
