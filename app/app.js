// Bargain Beacon — wiring: toolbar state, hash router, stats bar.
// The page has two views: the deal list (#/) and one deal's detail page
// (#/deal/<id>). Filters live in `state` and re-render the list on change.

import { DEALS, STORES, CATEGORIES, CHECKED_AT, SALE_WINDOW } from './data.js';
import { applyFilters, discountPct, savings, dealScore } from './filters.js';
import { renderList, dealDetail, esc } from './render.js';

const state = { q: '', cat: 'all', store: 'all', minPct: 0, sig: 'all', sort: 'score' };

const $ = (id) => document.getElementById(id);
const listHost = $('deal-list');
const detailHost = $('deal-detail');
const countLine = $('count-line');

function option(value, label) {
  return '<option value="' + esc(value) + '">' + esc(label) + '</option>';
}

function buildToolbar() {
  $('cat').innerHTML = option('all', 'All categories')
    + CATEGORIES.map((c) => option(c, c)).join('');
  $('store').innerHTML = option('all', 'All stores')
    + STORES.map((s) => option(s, s)).join('');
}

function renderStats() {
  const total = DEALS.length;
  const best = [...DEALS].sort((a, b) => dealScore(b) - dealScore(a))[0];
  const newLows = DEALS.filter((d) => d.sig === 'new-low').length;
  const avgPct = Math.round(DEALS.reduce((s, d) => s + discountPct(d), 0) / total);
  const totalSaved = DEALS.reduce((s, d) => s + savings(d), 0);
  $('stat-deals').textContent = total;
  $('stat-stores').textContent = STORES.length;
  $('stat-newlow').textContent = newLows;
  $('stat-avg').textContent = avgPct + '%';
  $('stat-saved').textContent = '$' + Math.round(totalSaved).toLocaleString('en-US');
  $('stat-best').textContent = best.name;
}

function renderListView() {
  detailHost.hidden = true;
  detailHost.innerHTML = '';
  listHost.hidden = false;
  $('toolbar').hidden = false;
  const list = applyFilters(DEALS, state);
  renderList(list, listHost);
  const shown = list.length;
  countLine.textContent = shown + ' of ' + DEALS.length + ' deals'
    + (state.q || state.cat !== 'all' || state.store !== 'all' || state.minPct > 0 || state.sig !== 'all'
      ? ' match your filters' : ' · sorted by Deal Score');
}

function renderDetailView(id) {
  const deal = DEALS.find((d) => d.id === id);
  listHost.hidden = true;
  $('toolbar').hidden = true;
  detailHost.hidden = false;
  countLine.textContent = '';
  if (!deal) {
    detailHost.innerHTML = '<p class="empty">That deal is not on this page. <a href="#/">Back to all deals</a>.</p>';
    return;
  }
  detailHost.innerHTML = dealDetail(deal);
  window.scrollTo(0, 0);
}

function route() {
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/deal\/([\w-]+)$/);
  if (m) renderDetailView(m[1]);
  else renderListView();
}

function wireToolbar() {
  $('q').addEventListener('input', (e) => { state.q = e.target.value; renderListView(); });
  $('cat').addEventListener('change', (e) => { state.cat = e.target.value; renderListView(); });
  $('store').addEventListener('change', (e) => { state.store = e.target.value; renderListView(); });
  $('minpct').addEventListener('change', (e) => { state.minPct = Number(e.target.value); renderListView(); });
  $('sig').addEventListener('change', (e) => { state.sig = e.target.value; renderListView(); });
  $('sort').addEventListener('change', (e) => { state.sort = e.target.value; renderListView(); });
  $('clear').addEventListener('click', () => {
    Object.assign(state, { q: '', cat: 'all', store: 'all', minPct: 0, sig: 'all', sort: 'score' });
    $('q').value = '';
    $('cat').value = 'all';
    $('store').value = 'all';
    $('minpct').value = '0';
    $('sig').value = 'all';
    $('sort').value = 'score';
    renderListView();
  });
}

buildToolbar();
wireToolbar();
renderStats();
$('checked-line').textContent = 'All prices checked ' + CHECKED_AT + ' · Sale window: ' + SALE_WINDOW + '. Prices move during Black Friday — confirm the price at the store before you pay.';
window.addEventListener('hashchange', route);
route();
