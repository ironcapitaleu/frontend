/**
 * ---
 *
 * Styles for the outermost container that holds all `Accordion` items.
 *
 * ---
 *
 * Effects:
 * - No direct visual effects, just establishing the layout
 * - Represents a flex column that takes the full width of the parent container
 * - Stacks the `Accordion` items vertically and allows them to take the full width of the container
 */
export const accordionRootStyles = "flex w-full flex-col";

/**
 * ---
 *
 * Styles applied to each `Accordion` item, i.e., one single row in the `Accordion`.
 *
 * ---
 *
 * Effects:
 * - Adds a visual border underneath each `Accordion` item as a separator (**excluding** the last item!)
 */
export const accordionItemStyles = "not-last:border-b";

/**
 * ---
 *
 * Styles applied to the clickable header button inside of an `Accordion` item.
 * Establishes the `group/accordion-trigger` context that child elements (e.g. the icon) depend on.
 *
 * ---
 *
 * Effects:
 * - Shows underline on hover
 * - Shows focus ring on keyboard focus
 * - Disables pointer events and reduces opacity when disabled
 * - Positions trigger text and icon on opposite ends of a flex row
 * - The border and background are transparent by default, becoming visible only on hover and focus
 * - The icon is expected to be a child of the trigger and listens to the `aria-expanded` state of the trigger to rotate when the item is expanded
 */
export const accordionTriggerStyles =
	"focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground rounded-lg py-2.5 text-left text-sm font-medium hover:underline focus-visible:ring-[3px] **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50";

/**
 * ---
 *
 * Styles applied to the `Accordion` trigger icon.
 *
 * ---
 *
 * Effects:
 * - Disables pointer events, prevents shrinking, and rotates the icon with 180° on expand
 * - Note: Expected to be used with one single icon (e.g. ChevronDown) that rotates the icon on expansion, rather than using separate icons for expanded/collapsed states
 * - Note: If multiple icons for the states (collapsed/expanded) are used, then one needs to adapt and remove the icon rotation and change code inside the component TSX file to use two separate icons
 */
export const accordionTriggerIconStyles =
	"pointer-events-none shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180";

/**
 * ---
 *
 * Styles applied to the `Accordion` panel root. The panel root is the outer container that holds the collapsible content of an `Accordion` item.
 *
 * ---
 *
 * Effects:
 * - Controls the open/close animations (the sliding down when opening, and sliding up when collapsing items)
 * - Clips overflow of the panel content, i.e., any content is hidden when the panel is closed (height = 0)
 * - Sets the font size of the `Accordion` content
 * - Note: Padding is NOT applied here, but to the inner `Accordion` content style
 */
export const accordionPanelStyles =
	"data-open:animate-accordion-down data-closed:animate-accordion-up text-sm overflow-hidden";

/**
 * ---
 *
 * Styles applied to the inner content div inside the panel. This holds the actual content.
 *
 * ---
 *
 * Effects:
 * - Controls the padding, link styling, paragraph spacing, and the height CSS variable that drives the animation of the panel
 * - Note: The `height` CSS variable is set (automatically by BaseUI) to the full height of the content when the panel is open, and 0 when it is closed - makes for a smooth expansion/collapse animation
 */
export const accordionContentStyles =
	"pt-0 pb-2.5 [&_a]:hover:text-foreground h-(--accordion-panel-height) data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4";
