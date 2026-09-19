import crypto from 'node:crypto';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const money = (value) => Math.round(value * 100) / 100;

export function createGame() {
  return {
    id: crypto.randomUUID(),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    day: 1,
    cash: 18000,
    debt: 0,
    reputation: 58,
    quality: 64,
    morale: 72,
    price: 26,
    inventory: 42,
    branches: 1,
    upgradeLevel: 1,
    marketingBudget: 0,
    staff: { cashier: 1, operator: 1, marketer: 0, manager: 1 },
    market: { trend: 0.02, competitorPrice: 28, competitorStrength: 62, supplier: 'Stable' },
    lastPeriod: { revenue: 0, expenses: 0, profit: 0, sales: 0 },
    history: [],
    events: ['Market entry successful. Foot traffic is healthy.']
  };
}

function workers(game) { return Object.values(game.staff).reduce((a, b) => a + b, 0); }
function addEvent(game, message) {
  game.events.unshift(message);
  game.events = game.events.slice(0, 20);
}
function requireCash(game, amount) {
  if (game.cash < amount) throw new Error(`Insufficient cash; need $${Math.ceil(amount).toLocaleString()}`);
  game.cash = money(game.cash - amount);
}

function simulateDay(game) {
  const staffPower = 0.7 + game.staff.cashier * .08 + game.staff.operator * .12 + game.staff.marketer * .1 + game.staff.manager * .09;
  const competitorGap = (game.price - game.market.competitorPrice) / 30;
  const demand = clamp((.52 + game.reputation / 120 + game.market.trend) * staffPower * (game.quality / 100) * (game.morale / 100) * (1 + game.upgradeLevel * .22) * (1 + game.marketingBudget / 2500) * (1.1 - competitorGap * .15), .2, 2.4);
  const units = clamp(Math.round(demand * (30 + workers(game) * 10 + game.branches * 14 + game.reputation / 5)), 0, game.inventory + 48);
  const revenue = units * game.price;
  const wages = game.staff.cashier * 720 + game.staff.operator * 840 + game.staff.marketer * 980 + game.staff.manager * 1200;
  const expenses = wages + 180 + game.upgradeLevel * 90 + game.branches * 160 + 1200 + game.upgradeLevel * 220 + game.branches * 380 + 240 + game.upgradeLevel * 120 + revenue * .09 + game.marketingBudget * .35;
  const profit = revenue - expenses;

  game.cash = money(game.cash + profit);
  game.inventory = Math.max(0, game.inventory - units + game.staff.operator * 4 + game.branches * 3);
  game.reputation = money(clamp(game.reputation + (profit > 0 ? 1.2 : -1.8) + game.quality / 150 - game.price / 160 + game.marketingBudget / 8000, 0, 100));
  game.quality = money(clamp(game.quality + (game.upgradeLevel > 1 ? .9 : .2) - (game.inventory < 10 ? 1.4 : 0), 30, 100));
  game.morale = money(clamp(game.morale + (profit > 0 ? 1.5 : -2.3), 25, 100));
  const supplierRoll = Math.random();
  if (supplierRoll > .82) { game.market.supplier = 'Delayed'; game.inventory = Math.max(0, game.inventory - 6); addEvent(game, 'Supplier delay reduced stock availability.'); }
  else if (supplierRoll > .65) game.market.supplier = 'Stable';
  else { game.market.supplier = 'Fast'; game.inventory += 6; }
  game.market.competitorPrice = money(clamp(game.market.competitorPrice + (Math.random() - .5) * 6, 16, 48));
  game.market.trend = money(clamp(game.market.trend + (Math.random() - .5) * .06, -.15, .25));
  game.lastPeriod = { revenue: money(revenue), expenses: money(expenses), profit: money(profit), sales: units };
  game.history.push({ day: game.day, ...game.lastPeriod, cash: game.cash });
  game.history = game.history.slice(-90);
  game.day += 1;
  game.updatedAt = new Date().toISOString();
  return game.lastPeriod;
}

export function applyAction(game, action) {
  const name = action.type;
  if (name === 'next-day') return { type: name, period: simulateDay(game) };
  if (name === 'price') game.price = clamp(Number(action.value), 12, 80);
  else if (name === 'hire') { const role = action.role; const costs = { cashier: 850, operator: 900, marketer: 1100 }; if (!costs[role]) throw new Error('Unknown staff role'); requireCash(game, costs[role]); game.staff[role] += 1; }
  else if (name === 'train') { requireCash(game, 700 + game.upgradeLevel * 120); game.quality = clamp(game.quality + 7, 0, 100); game.morale = clamp(game.morale + 6, 0, 100); }
  else if (name === 'restock') { requireCash( game, 260 + Math.max(0, 20 - game.inventory) * 12); game.inventory += 20; }
  else if (name === 'marketing') { const cost = 600 + game.marketingBudget * .65; requireCash(game, cost); game.marketingBudget += 600; game.reputation = clamp(game.reputation + 4, 0, 100); }
  else if (name === 'upgrade') { requireCash(game, 2600 + game.upgradeLevel * 1600); game.upgradeLevel += 1; game.quality = clamp(game.quality + 10, 0, 100); }
  else if (name === 'expand') { requireCash(game, 7000 + game.branches * 2800); game.branches += 1; }
  else if (name === 'loan') { game.cash += 5000; game.debt += 5000; }
  else throw new Error('Unknown action');
  game.updatedAt = new Date().toISOString();
  return { type: name, accepted: true };
}

export function serialiseGame(game) { return JSON.parse(JSON.stringify(game)); }
export function hydrateGame(raw) { return { ...createGame(), ...raw, staff: { ...createGame().staff, ...raw.staff }, market: { ...createGame().market, ...raw.market } }; }
