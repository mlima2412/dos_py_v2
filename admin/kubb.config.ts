import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginReactQuery } from "@kubb/plugin-react-query";

export default defineConfig({
	input: {
		path: "./openapi.json",
	},
	output: {
		path: "./src/api-client",
		clean: true,
	},
	plugins: [
		pluginOas({
			output: {
				path: "./types",
			},
		}),
		pluginTs({
			output: {
				path: "./types",
			},
			optionalType: "questionTokenAndUndefined",
			oasType: "infer",
		}),
		pluginZod({
			output: {
				path: "./schemas",
			},
			typed: true,
			dateType: "string",
			unknownType: "unknown",
			coercion: true,
		}),
		pluginReactQuery({
			output: {
				path: "./hooks",
			},
			client: {
				importPath: "@/lib/fetch-client",
			},
			// Desabilitar geração automática de hooks infinitos
			// pois nem todos os endpoints suportam paginação
			infinite: false,
		}),
	],
});
