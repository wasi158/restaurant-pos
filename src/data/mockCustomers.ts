export type Tier = 'VIP' | 'Regular' | 'New';

export type Customer = {
  id: string; name: string; email: string; phone: string;
  visits: number; spend: number; tier: Tier; lastVisit: string; fav: string;
};

export const TIERS: Tier[] = ['VIP', 'Regular', 'New'];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'GST-001', name: 'Alexandra Moore',  email: 'a.moore@email.com',    phone: '+1 555-1001', visits: 42, spend: 4820, tier: 'VIP',     lastVisit: '2 days ago',  fav: 'Ribeye Steak'     },
  { id: 'GST-002', name: 'James Thornton',   email: 'j.thornton@email.com', phone: '+1 555-1002', visits: 31, spend: 3210, tier: 'VIP',     lastVisit: 'Yesterday',   fav: 'Wagyu Burger'     },
  { id: 'GST-003', name: 'Priya Sharma',     email: 'p.sharma@email.com',   phone: '+1 555-1003', visits: 18, spend: 1640, tier: 'Regular', lastVisit: '5 days ago',  fav: 'Miso Cod'         },
  { id: 'GST-004', name: 'Carlos Mendez',    email: 'c.mendez@email.com',   phone: '+1 555-1004', visits: 14, spend: 1290, tier: 'Regular', lastVisit: '1 week ago',  fav: 'Truffle Pasta'    },
  { id: 'GST-005', name: 'Sophie Laurent',   email: 's.laurent@email.com',  phone: '+1 555-1005', visits: 9,  spend: 870,  tier: 'Regular', lastVisit: '3 days ago',  fav: 'Burrata Salad'    },
  { id: 'GST-006', name: 'Daniel Kim',       email: 'd.kim@email.com',      phone: '+1 555-1006', visits: 2,  spend: 180,  tier: 'New',     lastVisit: 'Today',       fav: 'Craft Lager'      },
  { id: 'GST-007', name: 'Rachel Okonkwo',   email: 'r.okonkwo@email.com',  phone: '+1 555-1007', visits: 1,  spend: 95,   tier: 'New',     lastVisit: 'Today',       fav: '—'                },
  { id: 'GST-008', name: 'Marcus Webb',      email: 'm.webb@email.com',     phone: '+1 555-1008', visits: 27, spend: 2980, tier: 'VIP',     lastVisit: '4 days ago',  fav: 'Espresso Martini' },
];

export const BLANK_CUSTOMER: Omit<Customer, 'id'> = { name: '', email: '', phone: '', visits: 0, spend: 0, tier: 'New', lastVisit: 'Today', fav: '' };
