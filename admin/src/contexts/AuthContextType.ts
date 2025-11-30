import {
	AuthControllerGetProfile200,
	AuthControllerGetUserParceiros200,
} from "@/api-client";
import { LoginDto } from "@/types/auth";

type ParceiroItem = AuthControllerGetUserParceiros200[0];

export interface AuthContextType {
	user: AuthControllerGetProfile200 | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	selectedPartnerData: ParceiroItem | null;
	login: (credentials: LoginDto) => Promise<void>;
	logout: () => Promise<void>;
	refreshProfile: () => Promise<void>;
	updateSelectedPartner: (partnerData: ParceiroItem | null) => void;
}
