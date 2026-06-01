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
	SendHorizonal,
	Settings2,
	LifeBuoy,
	ChefHat,
	Monitor,
	UtensilsCrossed,
	Tag,
	ShieldAlert,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type NavItem = { id: string; label: string; icon: React.ElementType };

const navItems: NavItem[] = [
	{ id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
	{ id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
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

interface SidebarProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
	onSendToKitchen: () => void;
	open: boolean;
	onClose: () => void;
}

export function Sidebar({
	activeTab,
	setActiveTab,
	onSendToKitchen,
	open,
	onClose,
}: SidebarProps) {
	return (
		<>
			{/* Mobile backdrop */}
			<div
				className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
				onClick={onClose}
			/>
			<aside
				className={`fixed inset-y-0 left-0 z-50 w-60 bg-surface-container-low h-screen flex flex-col border-r border-outline-variant shrink-0 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
			>
				{/* Brand */}
				<div className='px-5 pt-6 pb-5 border-b border-outline-variant'>
					<div className='flex items-center gap-3'>
						<div className='w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30'>
							<ChefHat className='w-5 h-5 text-on-primary-container' />
						</div>
						<div>
							<p className='text-sm font-bold text-on-surface font-headline leading-none'>
								Restaurant-POS
							</p>
							<p className='text-[10px] text-on-surface-variant mt-0.5 tracking-widest uppercase'>
								Admin Terminal
							</p>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className='flex-1 px-3 py-4 space-y-0.5 overflow-y-auto'>
					{navItems.map((item) => {
						const active = activeTab === item.id;
						return (
							<button
								key={item.id}
								onClick={() => setActiveTab(item.id)}
								className={cn(
									'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
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
								<span className='truncate'>{item.label}</span>
							</button>
						);
					})}
				</nav>

				{/* Footer */}
				<div className='px-3 pb-5 pt-3 space-y-2 border-t border-outline-variant'>
					{/* Send to Kitchen — opens modal */}
					<button
						onClick={onSendToKitchen}
						className='w-full bg-primary text-on-primary-container py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all text-sm shadow-md shadow-primary/25'
					>
						<SendHorizonal className='w-4 h-4' />
						Send to Kitchen
					</button>

					{/* Settings + Support — navigate to screens */}
					<div className='flex gap-1'>
						<button
							onClick={() => setActiveTab('settings')}
							className={cn(
								'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors text-xs font-medium',
								activeTab === 'settings'
									? 'bg-primary/15 text-primary font-semibold'
									: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
							)}
						>
							<Settings2 className='w-3.5 h-3.5' /> Settings
						</button>
						<button
							onClick={() => setActiveTab('support')}
							className={cn(
								'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors text-xs font-medium',
								activeTab === 'support'
									? 'bg-primary/15 text-primary font-semibold'
									: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
							)}
						>
							<LifeBuoy className='w-3.5 h-3.5' /> Support
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
