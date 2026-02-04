import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import {
	Combobox,
	ComboboxChips,
	ComboboxChip,
	ComboboxChipsInput,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxLabel,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from './combobox';

const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'] as const;

type ComboboxStoryArgs = {
	label: string;
	placeholder: string;
	disabled: boolean;
	required: boolean;
	showTrigger: boolean;
	showClear: boolean;
	defaultValue: (typeof frameworks)[number] | null;
};

/**
 * A `Combobox` is a filterable Select. 
 * A `Combobox` lets users select or search for a value from a list.
 * Use a `Combobox` when there are many options and typing or filtering is faster than scanning a static list.
 * `Combobox` components are interactive, because users must actively open the list, type to filter, and make a selection.
 */
const meta: Meta<ComboboxStoryArgs> = {
	title: 'Components/Combobox',
	component: Combobox,
	tags: ['autodocs'],
	args: {
		label: 'Framework',
		placeholder: 'Select a framework',
		disabled: false,
		required: false,
		showTrigger: true,
		showClear: true,
		defaultValue: null,
	},
	argTypes: {
		label: { control: 'text' },
		placeholder: { control: 'text' },
		disabled: { control: 'boolean' },
		required: { control: 'boolean' },
		showTrigger: { control: 'boolean' },
		showClear: { control: 'boolean' },
		defaultValue: {
			control: 'select',
			options: [null, ...frameworks],
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderSingleCombobox: Story['render'] = ({
	label,
	placeholder,
	disabled,
	required,
	showTrigger,
	showClear,
	defaultValue,
}) => {
	const id = React.useId();

	return (
		<Combobox
			items={frameworks}
			defaultValue={defaultValue ?? undefined}
			disabled={disabled}
			required={required}
		>
			<div className="flex flex-col gap-1">
				<label htmlFor={id} className="text-sm font-medium">
					{label}
				</label>
				<ComboboxInput
					id={id}
					placeholder={placeholder}
					className="w-72"
					disabled={disabled}
					showTrigger={showTrigger}
					showClear={showClear}
				/>
			</div>

			<ComboboxContent>
				<ComboboxEmpty>No matches.</ComboboxEmpty>
				<ComboboxList>
					{(item) => (
						<ComboboxItem key={item} value={item}>
							{item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
};

/**
 * Interactive playground for the Combobox component.
 */

// ==========================================
// PLAYGROUND
// ==========================================

export const Playground: Story = {
	render: renderSingleCombobox,
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
	render: renderSingleCombobox,
	args: {
		disabled: true,
		defaultValue: null,
	},
	argTypes: {
		disabled: { control: { disable: true } },
	},
};

type Produce = {
	id: string;
	label: string;
	group: 'Fruits' | 'Vegetables';
};

type ProduceGroup = {
	value: string;
	items: Produce[];
};

const produceData: Produce[] = [
	{ id: 'fruit-apple', label: 'Apple', group: 'Fruits' },
	{ id: 'fruit-banana', label: 'Banana', group: 'Fruits' },
	{ id: 'fruit-mango', label: 'Mango', group: 'Fruits' },
	{ id: 'fruit-kiwi', label: 'Kiwi', group: 'Fruits' },
	{ id: 'veg-broccoli', label: 'Broccoli', group: 'Vegetables' },
	{ id: 'veg-carrot', label: 'Carrot', group: 'Vegetables' },
	{ id: 'veg-spinach', label: 'Spinach', group: 'Vegetables' },
	{ id: 'veg-zucchini', label: 'Zucchini', group: 'Vegetables' },
];

function groupProduce(items: Produce[]): ProduceGroup[] {
	const groups: Record<string, Produce[]> = {};
	for (const item of items) {
		(groups[item.group] ??= []).push(item);
	}
	const order: ProduceGroup['value'][] = ['Fruits', 'Vegetables'];
	return order.map((value) => ({ value, items: groups[value] ?? [] }));
}

const groupedProduce = groupProduce(produceData);

/**
 * Grouped list example using `ComboboxGroup` + `ComboboxLabel`.
 */

// ==========================================
// GROUPED STORIES
// ==========================================

export const Grouped: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const id = React.useId();

		return (
			<Combobox items={groupedProduce}>
				<div className="flex flex-col gap-1">
					<label htmlFor={id} className="text-sm font-medium">
						Select produce
					</label>
					<ComboboxInput id={id} placeholder="e.g. Mango" className="w-72" />
				</div>

				<ComboboxContent>
					<ComboboxEmpty>No produce found.</ComboboxEmpty>
					<ComboboxList>
						{(group: ProduceGroup) => (
							<ComboboxGroup key={group.value} items={group.items} className="pb-2">
								<ComboboxLabel className="bg-popover sticky top-0">
									{group.value}
								</ComboboxLabel>
								<ComboboxCollection>
									{(item: Produce) => (
										<ComboboxItem key={item.id} value={item}>
											{item.label}
										</ComboboxItem>
									)}
								</ComboboxCollection>
							</ComboboxGroup>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		);
	},
};

const languages = [
	'JavaScript',
	'TypeScript',
	'Python',
	'Go',
	'Rust',
	'Swift',
	'Ruby',
] as const;

/**
 * Multiple-selection combobox rendered as removable chips.
 */

// ==========================================
// MULTI-SELECT STORIES
// ==========================================

export const MultipleSelectChips: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const id = React.useId();
		const anchorRef = useComboboxAnchor();

		return (
			<Combobox items={languages} multiple defaultValue={['TypeScript']}>
				<div className="flex flex-col gap-1">
					<label htmlFor={id} className="text-sm font-medium">
						Programming languages
					</label>

					<ComboboxChips ref={anchorRef} className="w-96 max-w-full">
						<ComboboxValue>
							{(value: string[]) => (
								<React.Fragment>
									{value.map((language) => (
										<ComboboxChip key={language} aria-label={language}>
											{language}
										</ComboboxChip>
									))}
									<ComboboxChipsInput
										id={id}
										placeholder={value.length > 0 ? '' : 'e.g. TypeScript'}
										aria-label="Programming languages"
									/>
								</React.Fragment>
							)}
						</ComboboxValue>
					</ComboboxChips>
				</div>

				<ComboboxContent anchor={anchorRef}>
					<ComboboxEmpty>No languages found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={item} value={item}>
								{item}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		);
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
