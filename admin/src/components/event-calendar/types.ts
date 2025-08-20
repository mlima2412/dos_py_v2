export type CalendarView = "mes" | "semana" | "dia" | "agenda";

export interface CalendarEvent {
	id: string;
	title: string;
	description?: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	color?: EventColor;
	location?: string;
}

export type EventColor =
	| "sky"
	| "amber"
	| "violet"
	| "rose"
	| "emerald"
	| "orange";
