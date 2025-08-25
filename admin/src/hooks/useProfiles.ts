import { useQuery } from "@tanstack/react-query";

interface Profile {
	id: number;
	nome: string;
	descricao?: string;
	ativo: boolean;
}

export const useProfiles = () => {
	return useQuery({
		queryKey: ["profiles"],
		queryFn: async (): Promise<Profile[]> => {
			const response = await fetch("/api/perfis", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Erro ao buscar perfis");
			}

			return response.json();
		},
	});
};

export type { Profile };
