import React from "react";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PartnerSelector } from "@/components/PartnerSelector";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface HeaderProps {
	onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const { t } = useTranslation("common");

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	const handleProfile = () => {
		// Navegar para página de perfil quando implementada
	};

	const getInitials = (name: string) => {
		const names = name.split(" ");
		if (names.length >= 2) {
			return `${names[0][0]}${names[1][0]}`.toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border">
			<div className="flex items-center justify-between h-full px-4">
				{/* Left side - Menu toggle and Partner Selector */}
				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={onMenuToggle}
						className="h-9 w-9"
					>
						<Menu className="h-5 w-5" />
					</Button>

					{user && <PartnerSelector />}
				</div>

				{/* Center - Empty space for balance */}
				<div className="flex-1"></div>

				{/* Right side - Theme toggle and User menu */}
				<div className="flex items-center space-x-3">
					<ThemeToggle />

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="relative h-9 w-9 rounded-full">
								<Avatar className="h-9 w-9">
									<AvatarImage src={user?.avatar} alt={user?.nome} />
									<AvatarFallback className="bg-primary text-primary-foreground">
										{user?.nome ? getInitials(user.nome) : "U"}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end" forceMount>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">
										{user?.nome || "Usuário"}
									</p>
									<p className="text-xs leading-none text-muted-foreground">
										{user?.email || "email@exemplo.com"}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleProfile}>
								<User className="mr-2 h-4 w-4" />
								<span>{t("header.profile")}</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout}>
								<LogOut className="mr-2 h-4 w-4" />
								<span>{t("header.logout")}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
};
