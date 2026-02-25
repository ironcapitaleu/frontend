/** Defines style for the outermost container that holds all Accordion items.
 * It is a purely structural element and does not contain any visual styling such as borders or padding.
 * It is a flex column that takes the full width of its parent (again, no visual styling effects).
 * The container stacks the Accordion items vertically and allows them to take the full width of the container.
 */
export const accordionRootStyles = "flex w-full flex-col";

/** Define style applied to each accordion item (which is a row in the Accordion). 
 * Adds a visual border underneath each Accordion item as a separator (excluding the last item!).
*/
export const accordionItemStyles = "not-last:border-b";

/** Defines style applied to the clickable header button inside of an Accordion item.
 * Handles all the interactivity reactions of the trigger - including underline when hovering, focus ring, and expansion of elements.
 * It is a flex container that aligns items to the start and justifies content between (i.e between the trigger text and the icon which are placed on opposite ends of the flex container).
 * The container has padding and rounded corners, but these are only visible on hover and focus due to the transparent border and background by default.
 */
export const accordionTriggerStyles =
	"focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground rounded-lg py-2.5 text-left text-sm font-medium hover:underline focus-visible:ring-[3px] **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50";

/** Styles for the accordion trigger icon. 
 * Disables pointer events, prevents shrinking, and rotates the icon with 180° on expand. 
 * Expected to be used with one single icon (e.g. ChevronDown) that rotates the icon on expansion, rather than using separate icons for expanded/collapsed states. 
 * Note: If multiple icons for the states (collapsed/expanded) are used, then one needs to adapt and remove the icon rotation and change code inside the component TSX file to use two separate icons.
 */
export const accordionTriggerIconStyles =
    "pointer-events-none shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180";

/** Styles for the Accordion panel root. 
 * The panel root is the outer container that holds the collapsible content of an Accordion item.
 * Only responsible for two things:
 * 	1. Controlling the open/close animations (the sliding down when opening, and sliding up when collapsing items).
 *  2. Clipping overflow (hiding it).
 * Padding is NOT applied here, but to the inner accordion content style (see below).
 */
export const accordionPanelStyles =
	"data-open:animate-accordion-down data-closed:animate-accordion-up text-sm overflow-hidden";

/**
 * Styles for the inner content div inside the panel. This holds the actual content.
 * This element applies padding, link styling, paragraph spacing, and the height CSS variable that drives the animation of the panel.
 * Note: The height CSS variable is set to the full height of the content when the panel is open, and 0 when it is closed - makes for a smooth expansion/collapse animation.
 */
export const accordionContentStyles =
	"pt-0 pb-2.5 [&_a]:hover:text-foreground h-(--accordion-panel-height) data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4";
