/** Base styles for the Accordion root container. */
export const accordionRootStyles = "flex w-full flex-col";

/** Styles for each Accordion item. Adds a bottom border except on the last item. */
export const accordionItemStyles = "not-last:border-b";

/** Styles for the Accordion trigger button. */
export const accordionTriggerStyles =
	"focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground rounded-lg py-2.5 text-left text-sm font-medium hover:underline focus-visible:ring-[3px] **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50";

/** Styles for the accordion trigger icon. Disables pointer events, prevents shrinking, and rotates 180° on expand. */
export const accordionTriggerIconStyles =
    "pointer-events-none shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180";

/** Styles for the Accordion panel root. Controls open/close animations. */
export const accordionPanelStyles =
	"data-open:animate-accordion-down data-closed:animate-accordion-up text-sm overflow-hidden";

/**
 * Styles for the inner content wrapper inside the Accordion panel.
 * Note: `className` from `AccordionContent` is applied here, not on the panel root,
 * to allow overriding the content padding and layout without affecting the animation wrapper.
 */
export const accordionContentStyles =
	"pt-0 pb-2.5 [&_a]:hover:text-foreground h-(--accordion-panel-height) data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4";
