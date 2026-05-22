export type Unit = 'kg' | 'g' | 'L' | 'ml' | 'pcs';

type UnitKind = 'mass' | 'volume' | 'count';

function kindOf(u: Unit): UnitKind {
  if (u === 'kg' || u === 'g') return 'mass';
  if (u === 'L' || u === 'ml') return 'volume';
  return 'count';
}

function factorToBase(u: Unit): number {
  // base mass: g, base volume: ml, base count: pcs
  switch (u) {
    case 'kg': return 1000;
    case 'g': return 1;
    case 'L': return 1000;
    case 'ml': return 1;
    case 'pcs': return 1;
  }
}

export function canConvert(from: Unit, to: Unit): boolean {
  return kindOf(from) === kindOf(to);
}

export function convertQty(qty: number, from: Unit, to: Unit): number {
  if (from === to) return qty;
  if (!canConvert(from, to)) {
    throw new Error(`Unit mismatch: cannot convert ${from} → ${to}`);
  }

  const base = qty * factorToBase(from);
  return base / factorToBase(to);
}

