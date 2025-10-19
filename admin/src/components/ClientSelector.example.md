# ClientSelector - Exemplo de Uso

## Descrição

O `ClientSelector` é um componente que permite selecionar clientes de um parceiro específico. Ele busca automaticamente os clientes usando o hook `useClientesControllerFindByParceiro`.

## Importação

```typescript
import { ClientSelector } from "@/components";
```

## Props

| Prop                | Tipo                         | Obrigatório | Descrição                                            |
| ------------------- | ---------------------------- | ----------- | ---------------------------------------------------- |
| `parceiroId`        | `string`                     | Sim         | ID do parceiro para buscar os clientes               |
| `selectedClientId`  | `number \| null`             | Sim         | ID do cliente atualmente selecionado                 |
| `onClientSelect`    | `(clientId: number) => void` | Sim         | Callback chamado quando um cliente é selecionado     |
| `disabled`          | `boolean`                    | Não         | Desabilita o seletor (padrão: `false`)               |
| `placeholder`       | `string`                     | Não         | Texto exibido quando nenhum cliente está selecionado |
| `searchPlaceholder` | `string`                     | Não         | Texto do placeholder do campo de busca               |
| `emptyMessage`      | `string`                     | Não         | Mensagem exibida quando não há clientes              |

## Exemplo de Uso Básico

```tsx
import React, { useState } from "react";
import { ClientSelector } from "@/components";
import { usePartner } from "@/hooks/usePartner";

export const MinhaComponente: React.FC = () => {
	const { selectedPartnerId } = usePartner();
	const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

	return (
		<ClientSelector
			parceiroId={selectedPartnerId || ""}
			selectedClientId={selectedClientId}
			onClientSelect={setSelectedClientId}
		/>
	);
};
```

## Exemplo com Placeholder Personalizado

```tsx
<ClientSelector
	parceiroId={selectedPartnerId || ""}
	selectedClientId={selectedClientId}
	onClientSelect={setSelectedClientId}
	placeholder="Selecione um cliente..."
	searchPlaceholder="Buscar por nome..."
	emptyMessage="Nenhum cliente encontrado"
/>
```

## Exemplo Desabilitado

```tsx
<ClientSelector
	parceiroId={selectedPartnerId || ""}
	selectedClientId={selectedClientId}
	onClientSelect={setSelectedClientId}
	disabled={!selectedPartnerId}
/>
```

## Estados Gerenciados Automaticamente

O componente gerencia automaticamente:

- **Loading**: Exibe mensagem de carregamento enquanto busca os clientes
- **Error**: Exibe mensagem de erro se a busca falhar
- **Empty**: Exibe mensagem quando não há clientes para o parceiro
- **Search**: Filtra clientes por nome completo (nome + sobrenome) conforme o usuário digita
- **Nome Completo**: Combina automaticamente nome e sobrenome do cliente para exibição

## Integração com Formulários

```tsx
import { useForm } from "react-hook-form";

interface FormData {
	clienteId: number;
	// outros campos...
}

export const FormularioVenda: React.FC = () => {
	const { selectedPartnerId } = usePartner();
	const { watch, setValue } = useForm<FormData>();

	const clienteId = watch("clienteId");

	return (
		<ClientSelector
			parceiroId={selectedPartnerId || ""}
			selectedClientId={clienteId}
			onClientSelect={id => setValue("clienteId", id)}
		/>
	);
};
```

## Notas

- O componente busca automaticamente os clientes quando o `parceiroId` muda
- A busca é habilitada apenas se `parceiroId` não estiver vazio
- O componente usa as traduções do i18n para mensagens padrão
- Todos os clientes são carregados de uma vez (não há paginação)
- **Nome Completo**: O componente automaticamente concatena `nome` e `sobrenome` do cliente
  - Se o cliente tem sobrenome: exibe "Nome Sobrenome"
  - Se o cliente não tem sobrenome: exibe apenas "Nome"
