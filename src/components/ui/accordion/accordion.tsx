import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import {
	accordionContentStyles,
	accordionItemStyles,
	accordionPanelStyles,
	accordionRootStyles,
	accordionTriggerStyles,
} from "./variants";

/** This component defines the `Accordion` element. It defines a stack of collapsible items.*/
function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			className={cn(accordionRootStyles, className)}
			{...props}
		/>
	);
}

/** This component defines a single item within an `Accordion` container. It contains components such as the `trigger`, `header`, and `content` (as well as any icons) that make up an `AccordionItem`. */
function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn(accordionItemStyles, className)}
			{...props}
		/>
	);
}

/** An `AccordionTrigger` is an interactive component that defines a button that is used to open and close the corresponding content panel. It renders an interactive `<button>` element. */
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
                    className="pointer-events-none shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180"
                />
			
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

/** This component defines the collapsible (hidable) content of an `AccordionItem`. It can be revealed or hidden by interacting with the `AccordionTrigger`.*/
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
