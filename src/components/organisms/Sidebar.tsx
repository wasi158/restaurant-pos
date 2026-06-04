import React from 'react';
import {
	LayoutGrid,
	ShoppingCart,
	ClipboardList,
	BookOpen,
	Armchair,
	Boxes,
	Truck,
	UsersRound,
	BarChart2,
	ContactRound,
	Settings2,
	LifeBuoy,
	ChefHat,
	Monitor,
	UtensilsCrossed,
	Tag,
	ShieldAlert,
	Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type NavItem = { id: string; label: string; icon: React.ElementType };

const navItems: NavItem[] = [
	{ id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
	{ id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
	{ id: 'receive-payment', label: 'Receive Payment', icon: Wallet },
	{ id: 'orders', label: 'Orders', icon: ClipboardList },
	{ id: 'menu', label: 'Menu', icon: BookOpen },
	{ id: 'tables', label: 'Dining & service', icon: Armchair },
	{ id: 'inventory', label: 'Inventory', icon: Boxes },
	{ id: 'vendors', label: 'Vendors', icon: Truck },
	{ id: 'deals', label: 'Deals', icon: Tag },
	{ id: 'staff', label: 'Staff', icon: UsersRound },
	{ id: 'reports', label: 'Reports', icon: BarChart2 },
	{ id: 'customers', label: 'Customers', icon: ContactRound },
	{ id: 'recipes', label: 'Recipes', icon: UtensilsCrossed },
	{ id: 'kitchen', label: 'Kitchen KDS', icon: Monitor },
	{ id: 'expiry', label: 'Expiry Alerts', icon: ShieldAlert },
];

const footerItems: NavItem[] = [
	{ id: 'settings', label: 'Settings', icon: Settings2 },
	{ id: 'support', label: 'Support', icon: LifeBuoy },
];

interface SidebarProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
	open: boolean;
	onClose: () => void;
}

function NavButton({
	item,
	active,
	onClick,
}: {
	item: NavItem;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group shrink-0',
				active
					? 'bg-primary text-on-primary-container font-semibold shadow-sm shadow-primary/20'
					: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
			)}
		>
			<item.icon
				className={cn(
					'w-[18px] h-[18px] shrink-0 transition-colors',
					active
						? 'text-on-primary-container'
						: 'text-on-surface-variant group-hover:text-on-surface',
				)}
			/>
			<span className="truncate text-left">{item.label}</span>
		</button>
	);
}

export function Sidebar({
	activeTab,
	setActiveTab,
	open,
	onClose,
}: SidebarProps) {
	const select = (id: string) => setActiveTab(id);

	return (
		<>
			{/* Mobile backdrop */}
			<div
				className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
				onClick={onClose}
				aria-hidden
			/>
			<aside
				className={cn(
					'fixed inset-y-0 left-0 z-50 w-60 bg-surface-container-low flex flex-col border-r border-outline-variant shrink-0',
					'h-dvh max-h-dvh lg:relative lg:h-full lg:max-h-full lg:min-h-0',
					'overflow-hidden',
					'transform transition-transform duration-200 ease-in-out lg:translate-x-0',
					open ? 'translate-x-0' : '-translate-x-full',
				)}
			>
				{/* Full sidebar scroll: brand → nav → settings / support */}
				<div
					className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
					aria-label="Sidebar navigation"
				>
					<div className="px-5 pt-6 pb-4 border-b border-outline-variant">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
								<ChefHat className="w-5 h-5 text-on-primary-container" />
							</div>
							<div className="min-w-0">
								<p className="text-sm font-bold text-on-surface font-headline leading-none truncate">
									Restaurant-POS
								</p>
								<p className="text-[10px] text-on-surface-variant mt-0.5 tracking-widest uppercase">
									Admin Terminal
								</p>
							</div>
						</div>
					</div>

					<nav className="px-3 py-3 space-y-0.5">
						{navItems.map((item) => (
							<NavButton
								key={item.id}
								item={item}
								active={activeTab === item.id}
								onClick={() => select(item.id)}
							/>
						))}
					</nav>

					<div className="px-3 pt-2 pb-5 mt-1 border-t border-outline-variant space-y-0.5">
						{footerItems.map((item) => (
							<NavButton
								key={item.id}
								item={item}
								active={activeTab === item.id}
								onClick={() => select(item.id)}
							/>
						))}
					</div>
				</div>
			</aside>
		</>
	);
}
