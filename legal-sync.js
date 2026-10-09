/* The Duck App legal page sync. No private credentials belong in this file. */
const LEGAL_API_URL = 'https://gssvklijklgfiiasvglj.supabase.co/rest/v1/rpc/get_public_legal_document';
const LEGAL_PUBLISHABLE_KEY = 'sb_publishable_-eyN1F3MZCsbfvc7VWmHoA_cW9ZI-Rs';

// Published legal documents only; never fall back to stale local policy text.
const USE_PUBLISHED_LEGAL = true;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|(?:terms|privacy|purchase-terms|support)\.html)\)/g,
    (_, label, href) => `<a href="${href}"${href.startsWith('https:') ? ' rel="noopener noreferrer"' : ''}>${label}</a>`);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return text;
}
function markdownBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = []; let paragraph = []; let list = []; let listType = null;
  const flushParagraph = () => { if (paragraph.length) { blocks.push({type:'p',text:paragraph.join(' ')}); paragraph=[]; } };
  const flushList = () => { if (list.length) { blocks.push({type:listType,items:list}); list=[]; listType=null; } };
  for (const line of lines) {
    const t=line.trim();
    if (!t) { flushParagraph(); flushList(); continue; }
    const heading=t.match(/^(#{1,6})\s+(.+)$/);
    const bullet=t.match(/^[-*+]\s+(.+)$/);
    const ordered=t.match(/^\d+[.)]\s+(.+)$/);
    if (heading) { flushParagraph(); flushList(); blocks.push({type:'heading',level:heading[1].length,text:heading[2]}); }
    else if (/^(-{3,}|\*{3,})$/.test(t)) { flushParagraph(); flushList(); blocks.push({type:'hr'}); }
    else if (bullet || ordered) { flushParagraph(); const kind=bullet?'ul':'ol'; if (listType && listType!==kind) flushList(); listType=kind; list.push((bullet||ordered)[1]); }
    else { flushList(); paragraph.push(t); }
  }
  flushParagraph(); flushList(); return blocks;
}
function renderLegal(markdown) {
  const blocks=markdownBlocks(markdown);
  let sections=[],current={heading:null,blocks:[]};
  const push=()=>{ if(current.heading||current.blocks.length) sections.push(current); current={heading:null,blocks:[]}; };
  for(const block of blocks) {
    if(block.type==='heading') { push(); current.heading=block.text; }
    else current.blocks.push(block);
  }
  push();
  const renderBlock=block=>block.type==='p' ? `<p>${inlineMarkdown(block.text)}</p>`
    : block.type==='hr' ? '<hr>'
    : `<${block.type}>${block.items.map(x=>`<li>${inlineMarkdown(x)}</li>`).join('')}</${block.type}>`;
  return sections.map(section=>`<section>${section.heading ? `<h2>${inlineMarkdown(section.heading)}</h2>` : ''}${section.blocks.map(renderBlock).join('')}</section>`).join('');
}
function showUnavailable(article, message) {
  article.innerHTML = `<section role="alert"><h2>Document temporarily unavailable</h2><p>${escapeHtml(message)}</p><p>Please contact <a href="support.html">Support</a> for a copy.</p></section>`;
}
async function loadPublishedLegal() {
  if (!USE_PUBLISHED_LEGAL) {
    console.info('[Legal] Development mode: original HTML agreements retained. Not reading test policies.');
    return;
  }
  const documentType = document.body.dataset.legalDocument;
  const article = document.getElementById('legal-content');
  const updated = document.getElementById('legal-updated');
  if (!article || !documentType) return;
  // Never display stale hardcoded policy wording in production if the fetch fails.
  article.replaceChildren();
  if (updated) updated.textContent = 'Loading published document…';
  try {
    const response = await fetch(LEGAL_API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'apikey':LEGAL_PUBLISHABLE_KEY},
      body: JSON.stringify({p_document_type:documentType}),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Legal API HTTP ${response.status}`);
    const result = await response.json();
    const documentRow = Array.isArray(result) ? result[0] : result;
    if (!documentRow || !documentRow.content_markdown || !documentRow.effective_at) throw new Error('No effective published document');
    article.innerHTML = renderLegal(documentRow.content_markdown, false);
    const date = new Date(documentRow.effective_at);
    if (updated) updated.textContent = `Effective ${Number.isNaN(date.getTime()) ? documentRow.effective_at : date.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})} · Version ${documentRow.version}`;
  } catch (error) {
    console.error('[Legal] Unable to load published document:', error);
    if (updated) updated.textContent = 'Unavailable';
    showUnavailable(article, 'We could not retrieve the current published agreement. Please try again later.');
  }
}
document.addEventListener('DOMContentLoaded', loadPublishedLegal);
