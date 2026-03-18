import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import {
	accordionContentStyles,
	accordionItemStyles,
	accordionPanelStyles,
	accordionRootStyles,
	accordionTriggerStyles,
	accordionTriggerIconStyles,
} from "./variants";

/** `Accordion` root element. It defines a stack of collapsible items.*/
function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			className={cn(accordionRootStyles, className)}
			{...props}
		/>
	);
}

/** `AccordionItem` element. It defines a single item within an `Accordion` container. It contains components such as the `trigger`, `header`, and `content` (as well as any icons) that make up an `AccordionItem`. */
function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn(accordionItemStyles, className)}
			{...props}
		/>
	);
}

/** `AccordionTrigger` is an interactive component that defines a button that is used to open and close the corresponding content panel. It renders an interactive `<button>` element. */
function AccordionTrigger({
	className,
	children,
	...props
}: AccordionPrimitive.Trigger.Props) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(accordionTriggerStyles, className)}
				{...props}
			>
				{children}

				{/* No pointer events, non-shrinkable, rotates 180° on expand with smooth transition */}
				<ChevronDownIcon
					data-slot="accordion-trigger-icon"
					className={accordionTriggerIconStyles}
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

/** `AccordionContent` defines the collapsible (hidable) content inside an `AccordionItem`. It can be revealed or hidden by interacting with the `AccordionTrigger`.*/
function AccordionContent({
	className,
	children,
	...props
}: AccordionPrimitive.Panel.Props) {
	return (
		<AccordionPrimitive.Panel
			data-slot="accordion-content"
			className={accordionPanelStyles}
			{...props}
		>
			<div className={cn(accordionContentStyles, className)}>{children}</div>
		</AccordionPrimitive.Panel>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
