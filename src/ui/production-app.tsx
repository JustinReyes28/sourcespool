import { useEffect, useState, useSyncExternalStore } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import type { ApplicationController, ProductionState } from '../application/controller.js';
import { cleanText } from '../domain/catalogue.js';
import stringWidth from 'string-width';

export function productionScreen(controller: ApplicationController, state: ProductionState, visible = 7, columns = 96): { title: string; lines: string[]; help: string } {
  const common = 'Esc Back · Ctrl+G Help · Ctrl+C Exit';
  const collection = state.catalogue.collections.find(c => c.id === state.draft.collectionId);
  const item = state.catalogue.items.find(i => i.id === state.itemId);
  const editing = (value: string) => {
    const chars = [...value]; const cursor = Math.min(state.cursor, chars.length); const budget = Math.max(20, (columns - 4) * 2);
    const start = Math.max(0, cursor - Math.floor(budget / 2)); const end = Math.min(chars.length, start + budget);
    const window = chars.slice(start, end); window.splice(cursor - start, 0, '▏');
    return `${start ? '…' : ''}${window.join('')}${end < chars.length ? '…' : ''}`;
  };
  const listWindow = <T,>(rows: T[], selected: number, render: (row: T, index: number) => string) => {
    const start = Math.max(0, Math.min(selected - Math.floor(visible / 2), rows.length - visible));
    return rows.slice(start, start + visible).map((row, index) => `${start + index === selected ? '>' : ' '} ${render(row, start + index)}`);
  };
  switch (state.page) {
    case 'home': return { title: 'Your references', lines: [`${state.catalogue.items.length} saved · ${state.catalogue.collections.length} collections`, `Library: ${controller.service.library.root}`, '', ...state.catalogue.collections.slice(0, 4).map(c => `${c.name}: ${state.catalogue.items.filter(i => i.collectionId === c.id).length}`), '', 'A Add reference · L Search library', 'C New collection · S Naming settings', 'E Export catalogue · I Import catalogue', `R Recover (${state.recovery.length} pending)`], help: 'Q Exit · Ctrl+G Help · Ctrl+C Exit' };
    case 'url': return { title: 'Add reference · Source', lines: ['Source URL', editing(state.draft.sourceUrl), '', 'Save only media you own or are permitted to keep.', 'One public item per save; authenticated sources and playlists are unsupported.'], help: `Enter Read source · ←/→ Edit · Ctrl+U Clear · ${common}` };
    case 'format': return { title: 'Add reference · Format', lines: [state.metadata?.title ?? '', '', ...listWindow(state.metadata?.formats ?? [], state.selected, f => f.label), '', `Selected format: ${state.draft.formatId}`], help: `↑/↓ Select · Enter Continue · ${common}` };
    case 'organize': return { title: 'Add reference · Organize', lines: [`Collection: ${collection?.name}`, '', `${state.field === 0 ? '>' : ' '} Tags (comma separated): ${state.field === 0 ? editing(state.draft.tags) : state.draft.tags || '(none)'}`, `${state.field === 1 ? '>' : ' '} Notes: ${state.field === 1 ? editing(state.draft.notes) : state.draft.notes || '(none)'}`, '', 'Destination preview (UTC date)', controller.preview()], help: `Tab Field · Ctrl+K Collection · Enter Review · ${common}` };
    case 'review': return { title: 'Ready to save', lines: [state.metadata?.title ?? '', `Source: ${state.draft.sourceUrl}`, `Collection: ${collection?.name}`, `Format: ${state.draft.formatId}`, `Tags: ${state.draft.tags || '(none)'}`, `Notes: ${state.draft.notes || '(none)'}`, '', 'Destination preview (UTC date)', controller.preview(), 'An existing filename receives a suffix; nothing is overwritten.'], help: `Enter Save · ${common}` };
    case 'progress': return { title: state.work === 'inspecting' ? 'Reading source' : state.work === 'committing' ? 'Finishing save' : state.work === 'verifying' ? 'Verifying file' : 'Downloading reference', lines: [state.metadata?.title ?? state.draft.sourceUrl, '', state.percent === null ? 'Working…' : `Progress: ${state.percent.toFixed(1)}%`, '', state.work === 'committing' ? 'Saving verified media and catalogue. Exit waits for the result.' : 'Your draft is kept if you cancel.', 'A completed catalogue entry is added only after file verification.'], help: 'Esc Cancel · Ctrl+G Help · Ctrl+C Cancel and exit' };
    case 'duplicate': return { title: 'This reference is already saved', lines: [state.duplicate?.reason === 'source' ? 'The source and selected format match an existing reference.' : 'The completed file has the same SHA-256 as an existing reference.', state.duplicate?.item.title ?? '', state.duplicate?.item.relativePath ?? '', '', 'K Keep existing · N Save another with a unique filename', 'Esc Cancel and keep your draft'], help: 'K Keep existing · N Save another · Esc Cancel · Ctrl+C Exit' };
    case 'completed': return { title: 'Reference saved', lines: [item?.title ?? '', item?.relativePath ?? '', item ? `${item.bytes.toLocaleString()} verified bytes · SHA-256 ${item.hash.slice(0, 16)}…` : '', '', state.notice], help: `Enter Search library · ${common}` };
    case 'library': { const rows = controller.results(); return { title: 'Search library', lines: [`Search: ${editing(state.search)}`, `${rows.length} matches · all search terms must match`, '', ...listWindow(rows, state.selected, row => `${row.title}  ${row.tags.map(t => '#' + t).join(' ')}`), ...(rows.length ? [] : ['No matches. Ctrl+U clears the search.'])], help: `↑/↓ Select · Enter Details · Ctrl+U Clear · ${common}` }; }
    case 'details': return { title: 'Reference details', lines: item ? [item.title, `Source: ${item.sourceUrl}`, `File: ${item.relativePath}`, `File status: ${state.fileStatus} (existence and size check)`, `Collection: ${state.catalogue.collections.find(c => c.id === item.collectionId)?.name}`, `Tags: ${item.tags.join(', ')}`, `Notes: ${item.notes}`, `${item.bytes.toLocaleString()} bytes · SHA-256 ${item.hash}`, '', 'O Open file · U Open source', ...(state.fileStatus === 'present' ? [] : ['Restore media at the expected path; source and notes remain available.'])] : ['Select a reference from the library.'], help: `O File · U Source · ${common}` };
    case 'settings': return { title: 'Collection naming settings', lines: [`Collection: ${collection?.name}`, 'Naming template', editing(state.template), '', 'Tokens: {collection} {date} {title} {id} {ext}', 'Date uses UTC. Template must end with .{ext}.', 'Preview', controller.preview()], help: `Ctrl+K Collection · Ctrl+U Clear · Enter Save · ${common}` };
    case 'collection': return { title: 'Create collection', lines: ['Collection name', editing(state.input), '', 'The collection starts with the default naming template.', 'You can change it in Naming settings.'], help: `Enter Create · Ctrl+U Clear · ${common}` };
    case 'export': return { title: 'Export catalogue metadata', lines: ['Destination JSON file (must not already exist)', editing(state.input), '', 'Includes source links, tags, notes and relative paths.', 'Media files are not included. Back up the media tree separately.'], help: `Enter Export · Ctrl+U Clear · ${common}` };
    case 'import': return { title: 'Import catalogue metadata', lines: ['Catalogue JSON file', editing(state.input), '', 'The next screen previews additions, conflicts and missing files.', 'Importing metadata does not download or restore media.'], help: `Enter Preview import · Ctrl+U Clear · ${common}` };
    case 'import-review': return { title: 'Review metadata import', lines: [`New items: ${state.importData?.added}`, `Conflicting items/collections: ${state.importData?.conflicts}`, `Missing or changed media files: ${state.importData?.missing}`, '', 'K Keep current records on id conflicts', 'I Use imported metadata on id conflicts', 'Existing media files are never overwritten.'], help: `K Keep current · I Use imported · ${common}` };
    case 'recovery': return { title: 'Recover interrupted work', lines: [...(state.lock ? [`Writer PID ${state.lock.pid}: ${state.lock.alive ? 'active — close that process first' : 'not running'}`, 'X Remove a verified stale writer lock'] : ['No writer lock.']), '', ...listWindow(state.recovery, state.selected, row => `${row.item.title} · ${row.state}`), ...(state.recovery.length ? ['R Recover selected verified item', 'U Keep file unlisted / dismiss journal; media is preserved'] : ['No pending commit journals.']), '', 'Unlisted files stay on disk. Missing or changed files cannot be recovered.'], help: `↑/↓ Select · R Recover · U Unlisted · X Stale lock · ${common}` };
    case 'failure': return { title: 'Operation needs attention', lines: ['Your draft is kept.', 'If the save was committing, inspect Recover before retrying.', 'R Return to the draft · H Home'], help: `R Retry · H Home · ${common}` };
    case 'cancelled': return { title: 'Operation cancelled', lines: ['The operation stopped before catalogue commit.', 'Source, format, tags and notes stay in your draft.', 'R Return to draft · H Home'], help: `R Retry · H Home · ${common}` };
  }
}

export function ProductionApp({ controller }: { controller: ApplicationController }) {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  const [help, setHelp] = useState(false); const { exit } = useApp(); const { stdout } = useStdout();
  const dimensions = () => ({ columns: (stdout as typeof stdout & { columns?: number }).columns ?? 80, rows: (stdout as typeof stdout & { rows?: number }).rows ?? 30 });
  const [size, setSize] = useState(dimensions);
  const [offset, setOffset] = useState(0);
  useEffect(() => setOffset(0), [state.page, help]);
  useEffect(() => { const resize = () => setSize(dimensions()); stdout.on('resize', resize); return () => { stdout.off('resize', resize); }; }, [stdout]);
  useEffect(() => { if (state.canExit) exit(); }, [state.canExit, exit]);
  const short = size.rows < 18 || size.columns < 35;
  const screen = productionScreen(controller, state, Math.max(2, Math.min(8, size.rows - 14)), Math.min(size.columns, 100));
  const width = Math.max(18, Math.min(size.columns, 100) - 2);
  const wrapLines = (lines: string[]) => lines.flatMap(value => {
    const output: string[] = []; let line = ''; let used = 0;
    for (const character of cleanText(value)) { const cells = stringWidth(character); if (used + cells > width) { output.push(line); line = ''; used = 0; } line += character; used += cells; }
    output.push(line); return output;
  });
  const helpLines = ['Keyboard help', 'Enter confirms the shown action. Esc goes back and keeps your draft.', '↑/↓ selects formats/results. Tab switches tags/notes. Ctrl+K switches collection.', '←/→ and Home/End move the field cursor. Backspace/Delete edit. Ctrl+U clears.', 'PgUp/PgDn scrolls long details, review screens and help.', 'Esc cancels work. Ctrl+C stops work and waits for the child process or commit.', 'During commit, cancellation waits for Saved or Recovery required.', 'Exports contain metadata only. Back up media separately.'];
  const footer = help ? 'PgUp/PgDn Read help · Esc Close · Ctrl+C Exit' : screen.help;
  const body = wrapLines(help ? helpLines : screen.lines);
  const footerRows = wrapLines([footer, state.error ? `Error: ${state.error}` : '', state.page !== 'completed' ? state.notice : ''].filter(Boolean)).length;
  const available = Math.max(2, size.rows - footerRows - (size.columns < 60 ? 5 : 4));
  const start = Math.min(offset, Math.max(0, body.length - available));
  useInput((input, key) => {
    if (key.ctrl && input === 'c') { controller.cancel(true); return; }
    if (key.ctrl && input === 'g') { setHelp(v => !v); return; }
    if (help) {
      if (key.pageUp || key.pageDown) setOffset(Math.max(0, Math.min(Math.max(0, body.length - available), start + (key.pageUp ? -available : available))));
      if (key.escape || key.return) setHelp(false); return;
    }
    if (key.escape) { controller.back(); return; }
    if (short) return;
    if (key.pageUp || key.pageDown) { setOffset(Math.max(0, Math.min(Math.max(0, body.length - available), start + (key.pageUp ? -available : available)))); return; }
    setOffset(0);
    if (state.page === 'duplicate') { if (input === 'k' || input === 'n') controller.choose(input === 'k' ? 'existing' : 'another'); return; }
    if (state.busy) return;
    if (state.page === 'home') {
      const pages = { a: 'url', l: 'library', c: 'collection', s: 'settings', e: 'export', i: 'import' } as const;
      const page = pages[input.toLowerCase() as keyof typeof pages]; if (page) controller.navigate(page);
      if (input.toLowerCase() === 'q') controller.cancel(true);
      if (input.toLowerCase() === 'r') void controller.recoveryPage(); return;
    }
    if (['failure', 'cancelled'].includes(state.page)) { if (input === 'r') controller.navigate('url'); if (input === 'h') controller.navigate('home'); return; }
    if (state.page === 'details') { if (input === 'o' || input === 'u') void controller.open(input === 'o' ? 'file' : 'source'); return; }
    if (state.page === 'import-review') { if (input === 'k' || input === 'i') void controller.importChoice(input === 'k' ? 'keep' : 'incoming'); return; }
    if (state.page === 'recovery' && ['r', 'u', 'x'].includes(input)) { void controller.recover(input === 'r' ? 'recover' : input === 'u' ? 'unlisted' : 'unlock'); return; }
    if (key.upArrow || key.downArrow) { if (['format', 'library', 'recovery'].includes(state.page)) controller.move(key.upArrow ? -1 : 1); return; }
    if (key.tab && state.page === 'organize') { controller.nextField(); return; }
    if (key.ctrl && input === 'k' && ['organize', 'settings'].includes(state.page)) { controller.cycleCollection(); return; }
    if (key.return) { void controller.continue(); return; }
    if (key.leftArrow || key.rightArrow || key.home || key.end) { controller.moveCursor(key.home ? 'home' : key.end ? 'end' : key.leftArrow ? -1 : 1); return; }
    if (key.ctrl && input !== 'u' || key.meta || key.tab) return;
    controller.edit(input, key.ctrl && input === 'u', key.backspace, key.delete);
  });
  return <Box flexDirection="column" width={Math.max(20, Math.min(size.columns, 100))} paddingX={1}>
    <Text bold>SourceSpool / local media library</Text>
    {short ? <><Text>Resize to at least 35 columns × 18 rows to continue.</Text><Text>Esc cancels work. Ctrl+C stops work and exits safely.</Text></> : <>
      <Text bold>{screen.title}</Text>
      {size.columns < 60 && <Text>Compact view · longer paths wrap</Text>}
      {body.slice(start, start + available).map((line, index) => <Text key={index} wrap="truncate">{line || ' '}</Text>)}
      {body.length > available && <Text>PgUp/PgDn scroll · lines {start + 1}–{Math.min(body.length, start + available)}/{body.length}</Text>}
      {state.error && <Text bold>Error: {cleanText(state.error)}</Text>}
      {state.notice && state.page !== 'completed' && <Text>{cleanText(state.notice)}</Text>}
      <Text>{footer}</Text>
    </>}
  </Box>;
}
