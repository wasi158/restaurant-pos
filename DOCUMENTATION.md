# Kinetic Darkroom - Application Documentation

Welcome to the **Kinetic Darkroom** restaurant management application. This software is built as a complete point-of-sale (POS) and administrative dashboard for a premium gastrolounge, running as a modern desktop application via Electron and React.

---

## 🏗️ Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Desktop Runtime**: Electron
- **Styling**: Tailwind CSS v4 + Vanilla CSS Custom Properties
- **Build Tool**: Vite
- **Charts / Analytics**: Recharts
- **Animations**: Motion (framer-motion)
- **Icons**: Lucide React

---

## 🚀 Running the Application

Because this app utilizes Electron to run as a native desktop application, it requires a specific startup sequence.

### Development Mode
To start the application in development mode with Hot Module Replacement (HMR):
```bash
npm install
npm run electron:dev
```
*This command runs Vite locally on port 3000, waits for it, and then boots the Electron wrapper.*

### Production Build
To package the app for distribution:
```bash
# Build for Windows
npm run electron:build:win

# Build for Mac
npm run electron:build:mac

# Build for Linux
npm run electron:build:linux
```
The compiled installers `.exe`, `.dmg`, or `.AppImage` will be placed in the `release/` directory.

---

## 🧩 Architecture overview

The application follows a strictly modular and separated architecture:

### 1. The Core Application (`src/App.tsx`)
This file is the main orchestrator. It holds global UI states (such as `activeTab` or `theme`) and handles routing manually via a standard switch statement (e.g., `case 'pos': return <POSScreen />`). 

### 2. The Data Layer (`src/data/`)
To keep React components clean, all mock data, TypeScript interfaces, and initial states are extracted into dedicated files inside the `src/data/` folder. This also paves an easy path to migrating to a real database (like SQLite or a cloud backend) in the future.
- `mockMenu.ts`, `mockOrders.ts`, `mockPOS.ts`, `mockStaff.ts`, `mockTables.ts`, etc.

### 3. Screen Components (`src/components/`)
Each major feature has its own full-screen component:
- **`DashboardScreen`**: Top level view of restaurant KPIs and quick actions.
- **`POSScreen`**: Complex Point-of-Sale interface allowing users to select tables, select items by category, apply quantities, select a payment method, and charge the customer.
- **`OrdersScreen`**: Tracks live orders passing between POS and Kitchen, allowing servers to mark things ready or print receipts.
- **`MenuScreen`**: Administrative CRUD (Create, Read, Update, Delete) table for adding or editing menu items.
- **`KitchenScreen`**: High-contrast Kanban board for the kitchen line to track prep and cook times.
- **`BillSlipScreen`**: A specialized, print-optimized component that generates the physical thermal receipt.

### 4. User Interface Logic (`index.css` & Tailwind)
The styling uses Tailwind CSS paired with a highly customized `index.css` design system. The system dynamically injects CSS variables to create distinct Light Mode / Dark Mode aesthetics utilizing "surface containers".

---

## 🎯 Key Features & Workflows

### 1. Point of Sale (POS) & Billing Flow
1. **Taking an order**: Navigate to the POS tab. Select an active Table.
2. **Adding items**: Click items from the central grid to add them to the cart on the right. Modify their quantity using the `+` and `-` buttons.
3. **Checkout**: Select a payment method (Card, Cash, Tap) and press **Charge**.
4. **Receipt Generation**: The application automatically clears the table, shifts state into a "Paid" mode, and routes you to the **Bill Slip Screen**.
5. **Printing**: From the Bill Slip, clicking "Print Receipt" triggers a print job. The application utilizes targeted CSS `@media print` rules to strip away UI panels and only print the pure, white receipt block.

### 2. Global Pagination
All large data lists in the application (such as the Menu Database, Customer List, Inventory, and Staff Logs) are protected by a universal **Pagination** component.
- The standard slice is **5 items per page**.
- The pagination interacts cleanly with search inputs: searching automatically resets the user back to Page 1 to prevent getting stuck in empty views.

### 3. Desktop Native Capabilities
- The top-bar includes standard window controls (Min, Max, Close) connected to Electron wrappers.
- The application frame features dragging areas (`-webkit-app-region: drag`) allowing users to drag the window natively via the TopBar.

---

## 🛠️ Modifying the Application

### Adding a New Screen
1. Create a logic file in `src/components/NewFeatureScreen.tsx`.
2. Open `src/App.tsx`.
3. Add a new `case 'new-feature': return <NewFeatureScreen />` to the routing function.
4. Open `src/components/Sidebar.tsx` and add your navigation button so the user can navigate to it.

### Connecting a Backend
When moving past mock data:
1. Replace the arrays in `src/data/` with React `useEffect` hooks fetching from an API or an IPC (Inter-Process Communication) connection to Electron's SQLite node integration.
2. Update the "Save" and "Delete" handler functions in the screen components to execute `POST`/`DELETE` calls instead of directly updating the React state arrays.
