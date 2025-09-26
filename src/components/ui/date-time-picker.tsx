"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface DateTimePickerProps {
	value?: Date | null;
	onChange?: (date?: Date) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	formatStr?: string;
	className?: string;
	/** optional placeholder text when no date is selected */
	placeholder?: string;
}

export function DateTimePicker({
	value,
	onChange,
	open,
	onOpenChange,
	formatStr = "MM/dd/yyyy hh:mm aa",
	className,
	placeholder = "MM/DD/YYYY hh:mm aa",
}: DateTimePickerProps) {
	// internal state when uncontrolled
	const [internal, setInternal] = React.useState<Date | undefined>(
		value ?? undefined,
	);

	// popover open state (controlled or internal)
	const [internalOpen, setInternalOpen] = React.useState(false);
	const isOpen = open ?? internalOpen;
	const setIsOpen = (v: boolean) => {
		if (onOpenChange) onOpenChange(v);
		if (open === undefined) setInternalOpen(v);
	};

	// sync internal state when controlled 'value' changes
	React.useEffect(() => {
		if (value === undefined) return;
		setInternal(value ?? undefined);
	}, [value]);

	const current = internal; // the date we render & mutate
	const setDate = (d?: Date) => {
		if (d === undefined) {
			setInternal(undefined);
			onChange?.(undefined);
			return;
		}
		setInternal(d);
		onChange?.(d);
	};

	const hours = Array.from({ length: 12 }, (_, i) => i + 1);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) return;
		// keep time-of-day from current if present
		const src = current ?? new Date();
		const newDt = new Date(selectedDate);
		newDt.setHours(src.getHours(), src.getMinutes(), 0, 0);
		setDate(newDt);
	};

	const handleTimeChange = (
		type: "hour" | "minute" | "ampm",
		valueStr: string,
	) => {
		if (!current) {
			// if no date yet, initialize to today at 00:00 and then apply
			const base = new Date();
			base.setSeconds(0, 0);
			setDate(base);
			// call again shortly (or just compute new one now)
		}

		const base = current ? new Date(current) : new Date();
		let hours = base.getHours(); // 0..23
		let minutes = base.getMinutes();
		let isPM = hours >= 12;

		if (type === "hour") {
			const requested12 = parseInt(valueStr, 10) % 12; // 0..11 where 12 -> 0
			// keep current AM/PM
			hours = requested12 + (isPM ? 12 : 0);
		} else if (type === "minute") {
			minutes = parseInt(valueStr, 10) || 0;
		} else if (type === "ampm") {
			const wantedPM = valueStr === "PM";
			if (wantedPM && hours < 12) hours += 12;
			if (!wantedPM && hours >= 12) hours -= 12;
		}

		const newDt = new Date(base);
		newDt.setHours(hours, minutes, 0, 0);
		setDate(newDt);
	};

	// helper to display button label
	const renderLabel = () =>
		current ? (
			format(current, formatStr)
		) : (
			<span className="text-muted-foreground">{placeholder}</span>
		);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!current && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{renderLabel()}
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-auto p-0">
				<div className="sm:flex">
					<Calendar
						mode="single"
						selected={current}
						onSelect={(d) => handleDateSelect(d ?? undefined)}
						initialFocus
					/>

					<div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{hours
									.slice()
									.reverse()
									.map((hour) => (
										<Button
											key={hour}
											size="icon"
											variant={
												current && current.getHours() % 12 === hour % 12
													? "default"
													: "ghost"
											}
											className="aspect-square shrink-0 sm:w-full"
											onClick={() => handleTimeChange("hour", hour.toString())}
										>
											{hour}
										</Button>
									))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>

						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
									<Button
										key={minute}
										size="icon"
										variant={
											current && current.getMinutes() === minute
												? "default"
												: "ghost"
										}
										className="aspect-square shrink-0 sm:w-full"
										onClick={() =>
											handleTimeChange("minute", minute.toString())
										}
									>
										{minute.toString().padStart(2, "0")}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>

						<ScrollArea>
							<div className="flex p-2 sm:flex-col">
								{["AM", "PM"].map((ampm) => (
									<Button
										key={ampm}
										size="icon"
										variant={
											current &&
											((ampm === "AM" && current.getHours() < 12) ||
												(ampm === "PM" && current.getHours() >= 12))
												? "default"
												: "ghost"
										}
										className="aspect-square shrink-0 sm:w-full"
										onClick={() => handleTimeChange("ampm", ampm)}
									>
										{ampm}
									</Button>
								))}
							</div>
						</ScrollArea>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export default DateTimePicker;
