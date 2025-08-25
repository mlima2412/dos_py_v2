# React Toastify - Guia de Uso

Este projeto utiliza o `react-toastify` para exibir notificações toast. Foi criado um hook personalizado `useToast` para facilitar o uso.

## Configuração

O `ToastContainer` já está configurado no `App.tsx` com as seguintes configurações:

- **Posição**: `top-right`
- **Auto Close**: `5000ms` (5 segundos)
- **Tema**: `colored`
- **Draggable**: Habilitado
- **Pause on Hover**: Habilitado

## Como Usar

### 1. Usando o Hook `useToast`

```tsx
import { useToast } from "@/hooks/useToast";

const MeuComponente = () => {
	const toast = useToast();

	const handleSuccess = () => {
		toast.success("Operação realizada com sucesso!");
	};

	const handleError = () => {
		toast.error("Erro ao realizar operação!");
	};

	const handleWarning = () => {
		toast.warning("Atenção: Verifique os dados!");
	};

	const handleInfo = () => {
		toast.info("Informação importante!");
	};

	return (
		<div>
			<button onClick={handleSuccess}>Sucesso</button>
			<button onClick={handleError}>Erro</button>
			<button onClick={handleWarning}>Aviso</button>
			<button onClick={handleInfo}>Info</button>
		</div>
	);
};
```

### 2. Usando as Funções Diretas

```tsx
import {
	toastSuccess,
	toastError,
	toastWarning,
	toastInfo,
} from "@/hooks/useToast";

// Em qualquer lugar do código
toastSuccess("Usuário criado com sucesso!");
toastError("Falha na autenticação!");
toastWarning("Sessão expirando em 5 minutos!");
toastInfo("Nova versão disponível!");
```

### 3. Configurações Personalizadas

```tsx
const toast = useToast();

// Toast com configuração personalizada
toast.success("Mensagem", {
	autoClose: 3000, // 3 segundos
	position: "bottom-right",
	theme: "dark",
});

// Toast que não fecha automaticamente
toast.info("Mensagem importante", {
	autoClose: false,
});
```

### 4. Controle de Toasts

```tsx
const toast = useToast();

// Fechar um toast específico
const toastId = toast.success("Mensagem");
toast.dismiss(toastId);

// Fechar todos os toasts
toast.dismissAll();
```

## Exemplos de Uso Comum

### Formulários

```tsx
const handleSubmit = async data => {
	try {
		await api.createUser(data);
		toast.success("Usuário criado com sucesso!");
		navigate("/usuarios");
	} catch (error) {
		toast.error("Erro ao criar usuário. Tente novamente.");
	}
};
```

### Operações de CRUD

```tsx
const handleDelete = async id => {
	try {
		await api.deleteUser(id);
		toast.success("Usuário excluído com sucesso!");
		refetch(); // Atualizar lista
	} catch (error) {
		toast.error("Erro ao excluir usuário.");
	}
};

const handleUpdate = async (id, data) => {
	try {
		await api.updateUser(id, data);
		toast.success("Usuário atualizado com sucesso!");
	} catch (error) {
		toast.error("Erro ao atualizar usuário.");
	}
};
```

### Validações

```tsx
const validateForm = data => {
	if (!data.email) {
		toast.warning("Email é obrigatório!");
		return false;
	}

	if (!data.password || data.password.length < 6) {
		toast.warning("Senha deve ter pelo menos 6 caracteres!");
		return false;
	}

	return true;
};
```

### Informações do Sistema

```tsx
// Notificações de sistema
toast.info("Sistema será atualizado em 10 minutos.");
toast.warning("Sessão expirando em 5 minutos.");
toast.error("Conexão perdida. Tentando reconectar...");
```

## Tipos de Toast Disponíveis

- **Success** (✅): Para operações bem-sucedidas
- **Error** (❌): Para erros e falhas
- **Warning** (⚠️): Para avisos e alertas
- **Info** (ℹ️): Para informações gerais
- **Default**: Toast padrão sem tipo específico

## Boas Práticas

1. **Use mensagens claras e concisas**
2. **Seja específico sobre o que aconteceu**
3. **Use o tipo correto de toast para cada situação**
4. **Evite toasts muito longos**
5. **Para operações críticas, considere usar toasts que não fecham automaticamente**
6. **Teste a experiência do usuário em diferentes dispositivos**

## Exemplo Completo

Veja o componente `ListarUsuarios.tsx` para um exemplo completo de implementação com botões de teste para cada tipo de notificação.
