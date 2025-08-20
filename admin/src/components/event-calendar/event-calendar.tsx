"use client";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { RiCalendarCheckLine } from "@remixicon/react";
import {
	addDays,
	addMonths,
	addWeeks,
	endOfWeek,
	format,
	isSameMonth,
	startOfWeek,
	subMonths,
	subWeeks,
} from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	PlusIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
	// addHoursToDate,
	AgendaDaysToShow,
	AgendaView,
	CalendarDndProvider,
	CalendarEvent,
	CalendarView,
	DayView,
	EventDialog,
	EventGap,
	EventHeight,
	MonthView,
	WeekCellsHeight,
	WeekView,
} from "@/components/event-calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export interface EventCalendarProps {
	events?: CalendarEvent[];
	onEventAdd?: (event: CalendarEvent) => void;
	onEventUpdate?: (event: CalendarEvent) => void;
	onEventDelete?: (eventId: string) => void;
	className?: string;
	initialView?: CalendarView;
	selectedPartnerLocale?: string;
}

export function EventCalendar({
	events = [],
	onEventAdd,
	onEventUpdate,
	onEventDelete,
	className,
	initialView = "mes",
	selectedPartnerLocale,
}: EventCalendarProps) {
	// Mapeamento de locales baseado no código ISO
	const localeMap = {
		"pt-BR": ptBR,
		"en-US": enUS,
		"es-ES": es,
		es: es,
		pt: ptBR,
		en: enUS,
	};

	// Determina o locale a ser usado baseado nos parâmetros
	const currentLocale = selectedPartnerLocale
		? localeMap[selectedPartnerLocale as keyof typeof localeMap] || ptBR
		: ptBR;
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState<CalendarView>(initialView);
	const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null
	);
	const navigate = useNavigate();
	const { i18n } = useTranslation();

	// Add keyboard shortcuts for view switching
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if user is typing in an input, textarea or contentEditable element
			// or if the event dialog is open
			if (
				isEventDialogOpen ||
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target instanceof HTMLElement && e.target.isContentEditable)
			) {
				return;
			}

			switch (e.key.toLowerCase()) {
				case "m":
					setView("mes");
					break;
				case "s":
					setView("semana");
					break;
				case "d":
					setView("dia");
					break;
				case "a":
					setView("agenda");
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isEventDialogOpen]);

	const handlePrevious = () => {
		if (view === "mes") {
			setCurrentDate(subMonths(currentDate, 1));
		} else if (view === "semana") {
			setCurrentDate(subWeeks(currentDate, 1));
		} else if (view === "dia") {
			setCurrentDate(addDays(currentDate, -1));
		} else if (view === "agenda") {
			// For agenda view, go back 30 days (a full month)
			setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
		}
	};

	const handleNext = () => {
		if (view === "mes") {
			setCurrentDate(addMonths(currentDate, 1));
		} else if (view === "semana") {
			setCurrentDate(addWeeks(currentDate, 1));
		} else if (view === "dia") {
			setCurrentDate(addDays(currentDate, 1));
		} else if (view === "agenda") {
			// For agenda view, go forward 30 days (a full month)
			setCurrentDate(addDays(currentDate, AgendaDaysToShow));
		}
	};

	const handleToday = () => {
		// Como eu altero o locale da data para o português
		setCurrentDate(new Date());
	};

	const handleEventSelect = (event: CalendarEvent) => {
		if (event.id) {
			navigate(`/despesas/visualizar/${event.id}`);
		}
		// setSelectedEvent(event);
		// setIsEventDialogOpen(true);
	};

	const handleEventCreate = (/*startTime: Date*/) => {
		// Snap to 15-minute intervals
		/*
		const minutes = startTime.getMinutes();
		const remainder = minutes % 15;
		if (remainder !== 0) {
			if (remainder < 7.5) {
				// Round down to nearest 15 min
				startTime.setMinutes(minutes - remainder);
			} else {
				// Round up to nearest 15 min
				startTime.setMinutes(minutes + (15 - remainder));
			}
			startTime.setSeconds(0);
			startTime.setMilliseconds(0);
		}

		const newEvent: CalendarEvent = {
			id: "",
			title: "",
			start: startTime,
			end: addHoursToDate(startTime, 1),
			allDay: false,
		};
		setSelectedEvent(newEvent);
		setIsEventDialogOpen(true);
		*/
	};

	const handleEventSave = (event: CalendarEvent) => {
		if (event.id) {
			onEventUpdate?.(event);
			// Show toast notification when an event is updated
			toast(`Event "${event.title}" updated`, {
				description: format(new Date(event.start), "MMM d, yyyy"),
				position: "bottom-left",
			});
		} else {
			onEventAdd?.({
				...event,
				id: Math.random().toString(36).substring(2, 11),
			});
			// Show toast notification when an event is added
			toast(`Event "${event.title}" added`, {
				description: format(new Date(event.start), "MMM d, yyyy"),
				position: "bottom-left",
			});
		}
		setIsEventDialogOpen(false);
		setSelectedEvent(null);
	};

	const handleEventDelete = (eventId: string) => {
		const deletedEvent = events.find((e) => e.id === eventId);
		onEventDelete?.(eventId);
		setIsEventDialogOpen(false);
		setSelectedEvent(null);

		// Show toast notification when an event is deleted
		if (deletedEvent) {
			toast(`Event "${deletedEvent.title}" deleted`, {
				description: format(new Date(deletedEvent.start), "MMM d, yyyy", {
					locale: currentLocale,
				}),
				position: "bottom-left",
			});
		}
	};

	const handleEventUpdate = (updatedEvent: CalendarEvent) => {
		onEventUpdate?.(updatedEvent);

		// Show toast notification when an event is updated via drag and drop
		toast(`Event "${updatedEvent.title}" moved`, {
			description: format(new Date(updatedEvent.start), "MMM d, yyyy", {
				locale: currentLocale,
			}),
			position: "bottom-left",
		});
	};

	const viewTitle = useMemo(() => {
		if (view === "mes") {
			return format(currentDate, "MMMM yyyy", { locale: currentLocale });
		} else if (view === "semana") {
			const start = startOfWeek(currentDate, { weekStartsOn: 0 });
			const end = endOfWeek(currentDate, { weekStartsOn: 0 });
			if (isSameMonth(start, end)) {
				return format(start, "MMMM yyyy", { locale: currentLocale });
			} else {
				return `${format(start, "MMM", { locale: currentLocale })} - ${format(end, "MMM yyyy", { locale: currentLocale })}`;
			}
		} else if (view === "dia") {
			return (
				<>
					<span
						className='min-[480px]:hidden'
						aria-hidden='true'
					>
						{format(currentDate, "MMM d, yyyy", { locale: currentLocale })}
					</span>
					{/* <span
						className='max-[479px]:hidden min-md:hidden'
						aria-hidden='true'
					>
						{format(currentDate, "MMMM d, yyyy", { locale: currentLocale })}
					</span> */}
					<span className='max-md:hidden'>
						{format(currentDate, "EEE, d 'de' MMMM yyyy", {
							locale: currentLocale,
						})}
					</span>
				</>
			);
		} else if (view === "agenda") {
			// Show the month range for agenda view
			const start = currentDate;
			const end = addDays(currentDate, AgendaDaysToShow - 1);

			if (isSameMonth(start, end)) {
				return format(start, "MMMM yyyy", { locale: currentLocale });
			} else {
				return `${format(start, "MMM", { locale: currentLocale })} - ${format(end, "MMM yyyy", { locale: currentLocale })}`;
			}
		} else {
			return format(currentDate, "MMMM yyyy", { locale: currentLocale });
		}
	}, [currentDate, view, currentLocale]);

	return (
		<div
			className='flex flex-col rounded-lg border has-data-[slot=month-view]:flex-1'
			style={
				{
					"--event-height": `${EventHeight}px`,
					"--event-gap": `${EventGap}px`,
					"--week-cells-height": `${WeekCellsHeight}px`,
				} as React.CSSProperties
			}
		>
			<CalendarDndProvider onEventUpdate={handleEventUpdate}>
				<div
					className={cn(
						"flex items-center justify-between p-2 sm:p-4",
						className
					)}
				>
					<div className='flex items-center gap-1 sm:gap-4'>
						<Button
							variant='outline'
							className='max-[479px]:aspect-square max-[479px]:p-0!'
							onClick={handleToday}
						>
							<RiCalendarCheckLine
								className='min-[480px]:hidden'
								size={16}
								aria-hidden='true'
							/>
							<span className='max-[479px]:sr-only'>
								{i18n.t("calendar.today")}
							</span>
						</Button>
						<div className='flex items-center sm:gap-2'>
							<Button
								variant='ghost'
								size='icon'
								onClick={handlePrevious}
								aria-label='Previous'
							>
								<ChevronLeftIcon
									size={16}
									aria-hidden='true'
								/>
							</Button>
							<Button
								variant='ghost'
								size='icon'
								onClick={handleNext}
								aria-label='Next'
							>
								<ChevronRightIcon
									size={16}
									aria-hidden='true'
								/>
							</Button>
						</div>
						<h2 className='text-sm font-semibold sm:text-lg md:text-xl'>
							{viewTitle}
						</h2>
					</div>
					<div className='flex items-center gap-2'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant='outline'
									className='gap-1.5 max-[479px]:h-8'
								>
									<span>
										<span
											className='min-[480px]:hidden'
											aria-hidden='true'
										>
											{view.charAt(0).toUpperCase()}
										</span>
										<span className='max-[479px]:sr-only'>
											{view.charAt(0).toUpperCase() + view.slice(1)}
										</span>
									</span>
									<ChevronDownIcon
										className='-me-1 opacity-60'
										size={16}
										aria-hidden='true'
									/>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='end'
								className='min-w-32'
							>
								<DropdownMenuItem onClick={() => setView("mes")}>
									{i18n.t("calendar.today")}{" "}
									<DropdownMenuShortcut>M</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setView("semana")}>
									{i18n.t("calendar.views.week")}{" "}
									<DropdownMenuShortcut>S</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setView("dia")}>
									{i18n.t("calendar.views.day")}{" "}
									<DropdownMenuShortcut>D</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setView("agenda")}>
									Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className='flex flex-1 flex-col'>
					{view === "mes" && (
						<MonthView
							currentDate={currentDate}
							events={events}
							onEventSelect={handleEventSelect}
							onEventCreate={handleEventCreate}
							locale={currentLocale}
						/>
					)}
					{view === "semana" && (
						<WeekView
							currentDate={currentDate}
							events={events}
							onEventSelect={handleEventSelect}
							onEventCreate={handleEventCreate}
							locale={currentLocale}
						/>
					)}
					{view === "dia" && (
						<DayView
							currentDate={currentDate}
							events={events}
							onEventSelect={handleEventSelect}
							onEventCreate={handleEventCreate}
							locale={currentLocale}
						/>
					)}
					{view === "agenda" && (
						<AgendaView
							currentDate={currentDate}
							events={events}
							onEventSelect={handleEventSelect}
							locale={currentLocale}
						/>
					)}
				</div>

				<EventDialog
					event={selectedEvent}
					isOpen={isEventDialogOpen}
					onClose={() => {
						setIsEventDialogOpen(false);
						setSelectedEvent(null);
					}}
					onSave={handleEventSave}
					onDelete={handleEventDelete}
					locale={currentLocale}
				/>
			</CalendarDndProvider>
		</div>
	);
}
