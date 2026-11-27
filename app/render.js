// Bargain Beacon — rendering: deal cards and the per-deal detail page.
// Builds DOM from template strings; every interpolated value goes through
// esc() first. No network calls, no images, no external anything.

import { DEALS, CHECKED_AT, storeUrl } from './data.js';
import {
  SIGNAL_LABEL, discountPct, savings, dealScore, money, moneyShort,
  sameProductElsewhere, bestPriceFor,
} from './filters.js';

export function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function signalBadge(deal) {
  return '<span class="sig sig-' + deal.sig + '">' + esc(SIGNAL_LABEL[deal.sig]) + '</span>';
}

function priceBlock(deal, big) {
  const pct = discountPct(deal);
  const usualNote = deal.usualNote ? ' <span class="usual-note">(' + esc(deal.usualNote) + ')</span>' : '';
  return '<div class="prices' + (big ? ' prices-big' : '') + '">'
    + '<span class="sale">' + money(deal.sale) + '</span>'
    + '<span class="usual">was ' + money(deal.usual) + '</span>' + usualNote
    + '<span class="pct">−' + pct + '%</span>'
    + '</div>';
}

export function dealCard(deal) {
  const pct = discountPct(deal);
  const score = dealScore(deal);
  const best = bestPriceFor(deal.name, DEALS);
  const cheapestHere = best && best.id === deal.id;
  const elsewhere = sameProductElsewhere(deal, DEALS).length;
  return '<article class="card" data-id="' + esc(deal.id) + '">'
    + '<div class="card-top"><span class="store">' + esc(deal.store) + '</span>'
    + '<span class="cat">' + esc(deal.cat) + '</span></div>'
    + '<h3 class="card-name"><a href="#/deal/' + esc(deal.id) + '">' + esc(deal.name) + '</a></h3>'
    + priceBlock(deal, false)
    + '<div class="card-row">' + signalBadge(deal)
    + '<span class="score" title="Deal Score: ' + pct + '% off counts most, then the honesty signal, then cash saved.">Score ' + score + '/100</span></div>'
    + '<p class="evidence">' + esc(deal.ev) + '</p>'
    + '<p class="meta">Checked ' + esc(CHECKED_AT) + ' · ' + esc(deal.src) + '</p>'
    + (cheapestHere && elsewhere
      ? '<p class="cheapest">Lowest price for this product on this page</p>'
      : elsewhere
        ? '<p class="elsewhere">Also at ' + elsewhere + ' other store' + (elsewhere > 1 ? 's' : '') + ' — see details to compare</p>'
        : '')
    + '<div class="card-actions">'
    + '<a class="btn-store" href="' + esc(storeUrl(deal)) + '" target="_blank" rel="noopener">View at ' + esc(deal.store) + ' ↗</a>'
    + '<a class="btn-detail" href="#/deal/' + esc(deal.id) + '">Details</a>'
    + '</div>'
    + '</article>';
}

export function renderList(list, host) {
  if (!list.length) {
    host.innerHTML = '<p class="empty">No deals match those filters. Clear the search or lower the minimum discount.</p>';
    return;
  }
  host.innerHTML = list.map(dealCard).join('');
}

function compareTable(deal) {
  const others = sameProductElsewhere(deal, DEALS);
  if (!others.length) {
    return '<p class="compare-none">No other store on this page carries this exact product, so there is nothing to compare it against here.</p>';
  }
  const rows = [deal, ...others]
    .sort((a, b) => a.sale - b.sale)
    .map((d) => '<tr' + (d.id === deal.id ? ' class="this-row"' : '') + '>'
      + '<td>' + esc(d.store) + (d.id === deal.id ? ' (this deal)' : '') + '</td>'
      + '<td>' + money(d.sale) + '</td>'
      + '<td>' + money(d.usual) + '</td>'
      + '<td>−' + discountPct(d) + '%</td>'
      + '<td>' + moneyShort(savings(d)) + ' saved</td>'
      + '<td><a href="' + esc(storeUrl(d)) + '" target="_blank" rel="noopener">View ↗</a></td>'
      + '</tr>').join('');
  return '<table class="compare"><thead><tr><th>Store</th><th>Sale</th><th>Usual</th><th>Off</th><th>Saved</th><th></th></tr></thead><tbody>'
    + rows + '</tbody></table>';
}

export function dealDetail(deal) {
  const pct = discountPct(deal);
  const score = dealScore(deal);
  const save = savings(deal);
  return '<div class="detail">'
    + '<p class="back"><a href="#/">← All deals</a></p>'
    + '<div class="detail-top"><span class="store">' + esc(deal.store) + '</span>'
    + '<span class="cat">' + esc(deal.cat) + '</span></div>'
    + '<h2>' + esc(deal.name) + '</h2>'
    + priceBlock(deal, true)
    + '<p class="math">' + money(deal.usual) + ' − ' + money(deal.sale) + ' = <strong>' + money(save) + ' saved</strong> (' + pct + '% off)</p>'
    + '<div class="card-row">' + signalBadge(deal)
    + '<span class="score">Deal Score ' + score + '/100</span></div>'
    + '<p class="evidence evidence-big">' + esc(deal.ev) + '</p>'
    + (deal.terms ? '<p class="terms">Terms: ' + esc(deal.terms) + '</p>' : '')
    + '<p class="meta">Price checked ' + esc(CHECKED_AT) + ' · Source: ' + esc(deal.src) + '</p>'
    + '<div class="detail-actions">'
    + '<a class="btn-store" href="' + esc(storeUrl(deal)) + '" target="_blank" rel="noopener">View at ' + esc(deal.store) + ' ↗</a>'
    + '</div>'
    + '<h3>Same product at other stores</h3>'
    + compareTable(deal)
    + '</div>';
}
