import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface Language {
	code: string;
	name: string;
	flag: string;
}

const languages: Language[] = [
	{ code: "pt", name: "Português", flag: "🇧🇷" },
	{ code: "es", name: "Español", flag: "🇵🇾" },
];

export const LanguageSelector: React.FC = () => {
	const { i18n } = useTranslation();

	const handleLanguageChange = (langCode: string) => {
		i18n.changeLanguage(langCode);
	};

	return (
		<div className="flex space-x-2">
			{languages.map(lang => {
				const isActive = lang.code === i18n.language;

				return (
					<Button
						key={lang.code}
						onClick={() => handleLanguageChange(lang.code)}
						variant={isActive ? "default" : "outline"}
						size="sm"
						className={`flex items-center space-x-1 ${
							isActive ? "underline font-bold" : "font-thin"
						}`}
					>
						<span>{lang.flag}</span>
						<span>{lang.name}</span>
					</Button>
				);
			})}
		</div>
	);
};
