import { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { initialState, searchItems, transition } from '../application/design-simulator.js';
import { screenFor } from './presentation.js';
import type { DesignState, Draft } from '../domain/model.js';

const fields: (keyof Draft)[] = ['tags', 'notes'];

export function App({ empty = false, initial }: { empty?: boolean; initial?: DesignState }) {
  const [state, setState] = useState(initial ?? initialState(empty ? [] : undefined));
  const [field, setField] = useState(0);
  const [help, setHelp] = useState(false);
  const [notice, setNotice] = useState('');
  const { exit } = useApp();
  const { stdout } = useStdout();
  const getColumns = () => (stdout as NodeJS.WritableStream & { columns?: number }).columns || 80;
  const [columns, setColumns] = useState(getColumns);
  useEffect(() => {
    const resize = () => setColumns(getColumns());
    stdout.on('resize', resize);
    return () => { stdout.off('resize', resize); };
  }, [stdout]);
  const screen = screenFor(state);
  useInput((input, key) => {
    if (key.ctrl && input === 'c') { exit(); return; }
    if (key.ctrl && input === 'g') { setHelp(value => !value); return; }
    if (help) { if (key.escape || key.return) setHelp(false); return; }
    if (key.escape) { setNotice(''); setState(value => transition(value,
      ['progress', 'loading', 'duplicate'].includes(value.stage) ? { type: 'cancel' } : { type: 'back' })); return; }
    if (state.stage === 'home') {
      const destination = { a: 'url', l: 'library', s: 'settings' }[input.toLowerCase()] as 'url' | 'library' | 'settings' | undefined;
      if (destination) setState(value => transition(value, { type: 'go', stage: destination }));
      return;
    }
    if (['loading', 'progress', 'duplicate'].includes(state.stage) && input === 'x') {
      setState(value => transition(value, { type: 'cancel' })); return;
    }
    if (['loading', 'progress'].includes(state.stage) && input === 'f') {
      setState(value => transition(value, { type: 'failure', reason: 'The source could not be read. Check the URL, then retry.' })); return;
    }
    if (['failure', 'cancelled'].includes(state.stage) && input === 'r') {
      setState(value => transition(value, { type: 'retry' })); return;
    }
    if (state.stage === 'cancelled' && input === 'h') { setState(value => transition(value, { type: 'go', stage: 'home' })); return; }
    if (state.stage === 'failure' && input === 'x') { setState(value => transition(value, { type: 'cancel' })); return; }
    if (state.stage === 'duplicate') {
      if (input === 'k' || input === 'n') setState(value => transition(value, { type: 'duplicate', choice: input === 'k' ? 'existing' : 'another' }));
      return;
    }
    if (state.stage === 'format' && ['1', '2'].includes(input)) {
      setState(value => transition(value, { type: 'edit', field: 'formatId', value: input === '1' ? 'video-720' : 'audio' })); return;
    }
    if (state.stage === 'organize' && key.tab) { setField(value => (value + 1) % fields.length); return; }
    if (state.stage === 'organize' && input === 'k' && key.ctrl) {
      setState(value => transition(value, { type: 'edit', field: 'collectionId', value: value.draft.collectionId === 'studio' ? 'field-notes' : 'studio' })); return;
    }
    if (key.return) {
      if (state.stage === 'library') {
        const first = searchItems(state.items, state.search)[0];
        if (first) setState(value => transition(value, { type: 'details', id: first.id }));
      } else setState(value => transition(value, { type: 'next' }));
      return;
    }
    if (state.stage === 'details' && ['o', 'u', 'e'].includes(input)) { setNotice('This action is planned for phase 3. No file or browser was opened.'); return; }
    if (key.ctrl && input !== 'u') return;
    if (key.tab || key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.meta) return;
    const edit = (value: string) => key.ctrl && input === 'u' ? '' : key.backspace || key.delete ? value.slice(0, -1) : value + input.replace(/[\x00-\x1f\x7f]/g, '');
    if (state.stage === 'url') setState(value => transition(value, { type: 'edit', field: 'sourceUrl', value: edit(value.draft.sourceUrl) }));
    if (state.stage === 'organize') { const current = fields[field] ?? 'tags'; setState(value => transition(value, { type: 'edit', field: current, value: edit(value.draft[current]) })); }
    if (state.stage === 'library') setState(value => transition(value, { type: 'search', value: edit(value.search) }));
    if (state.stage === 'settings') setState(value => transition(value, { type: 'template', value: edit(value.template) }));
  });
  return <Box flexDirection="column" width={Math.max(20, Math.min(columns, 100))} paddingX={1}>
    <Text bold>SourceSpool / design prototype</Text>
    <Text>Local fixtures · no downloads · changes last for this session</Text>
    <Box marginY={1}><Text bold>{screen.title}</Text></Box>
    {columns < 60 && <Text>Compact view · resize for longer file paths</Text>}
    {screen.lines.map((line, index) => <Text key={index} wrap="wrap">{line || ' '}</Text>)}
    {state.stage === 'organize' && <Text bold>Editing: {fields[field]} · Ctrl+U clears · Ctrl+K changes collection</Text>}
    {notice && <Text>{notice}</Text>}
    <Box marginTop={1}><Text wrap="wrap">{screen.help}</Text></Box>
    {help && <Box flexDirection="column" marginTop={1} borderStyle="single" paddingX={1}>
      <Text bold>Help</Text><Text>Enter continues. Esc goes back and keeps your draft.</Text>
      <Text>During work, Esc or X cancels. R reopens a cancelled draft.</Text>
      <Text>Type in source, tags, notes, search and template fields. Ctrl+U clears.</Text>
      <Text>F simulates a failure while reading or saving. Ctrl+C exits.</Text>
      <Text>Esc closes help. All media and completion states are simulated.</Text>
    </Box>}
  </Box>;
}
