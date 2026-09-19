import crypto from 'node:crypto';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round = (v) => Math.round(v * 100) / 100;

export function createGame() {
  return { id: crypto.randomUUID(), version: 1, day: 1, cash: 18000, debt: 0, reputation: 58, quality: 64, morale: 72, price: 26, inventory: 42, branches: 1, upgradeLevel: 1, marketingBudget: 0, staff: { cashier: 1, operator: 1, marketer: 0, manager: 1 }, market: { trend: .02, competitorPrice: 28, competitorStrength: 62, supplier: 'Stable' }, lastPeriod: { revenue: 0, expenses: 0, profit: 0, sales: 0 }, history: [] };
}
function workers(g) { return Object.values(g.staff).reduce((a, b) => a + b, 0); }
function charge(g, amount) { if (g.cash < amount) throw new Error(`Insufficient cash; need $${Math.ceil(amount).toLocaleString()}`); g.cash = round(g.cash - amount); }

export function applyAction(game, action, random = Math.random) {
  if (action.type === 'next-day') {
    const staffPower = .7 + game.staff.cashier * .08 + game.staff.operator * .12 + game.staff.marketer * .1 + game.staff.manager * .09;
    const gap = (game.price - game.market.competitorPrice) / 30;
    const demand = clamp((.52 + game.reputation / 120 + game.market.trend) * staffPower * game.quality / 100 * game.morale / 100 * (1 + game.upgradeLevel * .22) * (1 + game.marketingBudget / 2500) * (1.1 - gap * .15), .2, 2.4);
    const sales = clamp(Math.round(demand * (30 + workers(game) * 10 + game.branches * 14 + game.reputation / 5)), 0, game.inventory + 48);
    const revenue = sales * game.price;
    const wages = game.staff.cashier * 720 + game.staff.operator * 840 + game.staff.marketer * 980 + game.staff.manager * 1200;
    const expenses = wages + 180 + game.upgradeLevel * 90 + game.branches * 160 + 1200 + game.upgradeLevel * 220 + game.branches * 380 + 240 + game.upgradeLevel * 120 + revenue * .09 + game.marketingBudget * .35;
    const profit = revenue - expenses;
    game.cash = round(game.cash + profit); game.inventory = Math.max(0, game.inventory - sales + game.staff.operator * 4 + game.branches * 3);
    game.reputation = round(clamp(game.reputation + (profit > 0 ? 1.2 : -1.8) + game.quality / 150 - game.price / 160 + game.marketingBudget / 8000, 0, 100));
    game.quality = round(clamp(game.quality + (game.upgradeLevel > 1 ? .9 : .2) - (game.inventory < 10 ? 1.4 : 0), 30, 100));
    game.morale = round(clamp(game.morale + (profit > 0 ? 1.5 : -2.3), 25, 100));
    game.market.supplier = random() > .82 ? 'Delayed' : random() > .65 ? 'Stable' : 'Fast';
    if (game.market.supplier === 'Delayed') game.inventory = Math.max(0, game.inventory - 6);
    if (game.market.supplier === 'Fast') game.inventory += 6;
    game.market.competitorPrice = round(clamp(game.market.competitorPrice + (random() - .5) * 6, 16, 48));
    game.market.trend = round(clamp(game.market.trend + (random() - .5) * .06, -.15, .25));
    game.lastPeriod = { revenue: round(revenue), expenses: round(expenses), profit: round(profit), sales };
    game.history.push({ day: game.day, ...game.lastPeriod, cash: game.cash }); game.history = game.history.slice(-90); game.day += 1;
    return game.lastPeriod;
  }
  if (action.type === 'price') game.price = action.value;
  else if (action.type === 'hire') { const cost = { cashier: 850, operator: 900, marketer: 1100 }[action.role]; charge(game, cost); game.staff[action.role] += 1; }
  else if (action.type === 'train') { charge(game, 700 + game.upgradeLevel * 120); game.quality = clamp(game.quality + 7, 0, 100); game.morale = clamp(game.morale + 6, 0, 100); }
  else if (action.type === 'restock') { charge(game, 260 + Math.max(0, 20 - game.inventory) * 12); game.inventory += 20; }
  else if (action.type === 'marketing') { charge(game, 600 + game.marketingBudget * .65); game.marketingBudget += 600; game.reputation = clamp(game.reputation + 4, 0, 100); }
  else if (action.type === 'upgrade') { charge(game, 2600 + game.upgradeLevel * 1600); game.upgradeLevel += 1; game.quality = clamp(game.quality + 10, 0, 100); }
  else if (action.type === 'expand') { charge(game, 7000 + game.branches * 2800); game.branches += 1; }
  else if (action.type === 'loan') { game.cash += 5000; game.debt += 5000; }
  else throw new Error('Unsupported action');
  return { accepted: true };
}
