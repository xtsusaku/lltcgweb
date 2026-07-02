/**
 * Prompt UI: submit guards, helpers, hand-pick, surveil, choice handler.
 */
(function (global) {
  'use strict';

  global.promptSubmitKey = function promptSubmitKey(s) {
    const pr = s?.pending_prompt;
    if (!pr || !s) return null;
    return `${s.seq}:${pr.type}:${pr.step ?? ''}:${pr.responder ?? ''}`;
  };

  global.markPromptSubmitting = function markPromptSubmitting(s) {
    global.G._promptSubmitKey = global.promptSubmitKey(s || global.G.gameState);
  };

  global.syncPromptSubmitState = function syncPromptSubmitState(s) {
    const pr = s?.pending_prompt;
    if (!pr) {
      global.G._promptSubmitKey = null;
      if (global.G._deferredPromptState?.pending_prompt) global.clearDeferredPromptState();
      return;
    }
    if (!global.G._promptSubmitKey) return;
    if (global.promptSubmitKey(s) !== global.G._promptSubmitKey) global.G._promptSubmitKey = null;
  };

  global.isPromptSubmitting = function isPromptSubmitting(s) {
    if (!global.G._promptSubmitKey) return false;
    const key = global.promptSubmitKey(s);
    return !!key && key === global.G._promptSubmitKey;
  };

  global.suppressPromptOverlaysWhileSubmitting = function suppressPromptOverlaysWhileSubmitting() {
    global.el('overlay-prompt')?.classList.remove('open');
    global.closeM('overlay-hand-pick');
    global.closeM('overlay-pick');
    global.closeM('overlay-heart');
  };

  global.syncAntiSoftlockButton = function syncAntiSoftlockButton(s, myId) {
  const btn = el('btn-anti-softlock');
  if (!btn) return;
  const onGame = el('screen-game')?.classList.contains('active');
  const show = !!(onGame && !G.isSpectator && hasAntiSoftlockTarget(s, myId));
  btn.hidden = !show;
}

global.openPickMemberReturnEnergy = function openPickMemberReturnEnergy(pr){
  const members=pr.members||[];
  el('pick-ttl').textContent=pr.source_name||'Return Energy';
  el('pick-msg').textContent=pr.prompt||'Choose a Member with stacked Energy to return.';
  const g=el('pick-grid'); g.innerHTML='';
  members.forEach(m=>{
    const card={instance_id:m.instance_id,name:m.name,name_en:m.name,cost:m.stacked_count};
    g.appendChild(mkPickCardEl(card,'pickcard',()=>{
      closeM('overlay-pick');
      sendAct('resolve_prompt',{member_id:m.instance_id,count:m.stacked_count||1});
    }));
  });
  el('pick-count').textContent='';
  openM('overlay-pick');
}

global.openHandPick = function openHandPick({hand,count,title,msg,onConfirm,onCancel,min,allowCancel=true,confirmLabel,forceConfirm=false}){
  const need=count;
  const minPick=min??count;
  const singleTap=!forceConfirm&&need===1&&minPick===1;
  G.handPickCtx={count:need,min:minPick,singleTap,onConfirm,onCancel};
  G.pickMarked.clear();
  el('hpick-ttl').textContent=title||t('prompt.chooseFromHand');
  el('hpick-msg').textContent=localizeSubunitText(msg||(singleTap
    ? t('prompt.discardOne')
    : t('prompt.discardMany', { count: need })));
  const fan=el('hpick-fan'); fan.innerHTML='';
  (hand||[]).forEach(card=>{
    fan.appendChild(mkPickCardEl(card,'hand-pick-card',()=>{
      const ctx=G.handPickCtx; if(!ctx) return;
      if(ctx.singleTap){
        markPromptSubmitting(G.gameState);
        closeM('overlay-hand-pick');
        G.handPickCtx=null; G.pickMarked.clear();
        ctx.onConfirm?.([card.instance_id]);
        return;
      }
      if(G.pickMarked.has(card.instance_id)) G.pickMarked.delete(card.instance_id);
      else {
        if(G.pickMarked.size>=ctx.count){ toast(`Select at most ${ctx.count}`); return; }
        G.pickMarked.add(card.instance_id);
        sfxCardPick();
      }
      [...fan.children].forEach(c=>c.classList.toggle('sel',G.pickMarked.has(c.dataset.id)));
      el('hpick-count').textContent=formatSelectedCount(G.pickMarked.size, ctx.count);
    }));
  });
  el('hpick-count').textContent=singleTap
    ? (confirmLabel || t('prompt.tapCardConfirm'))
    : formatSelectedCount(0, need);
  const showActions = !singleTap;
  el('hpick-actions').style.display = showActions ? 'flex' : 'none';
  el('btn-hpick-cancel').style.display = allowCancel === false ? 'none' : '';
  syncHandPickOverlayButtons();
  closeM('overlay-pick');
  openM('overlay-hand-pick');
  syncAntiSoftlockButton(G.gameState, G.playerId);
}

function findPromptSourceCard(pr, s) {
  if (!pr?.source_id || !s) return null;
  const pid = pr.owner || pr.responder;
  const p = s.players?.[pid];
  if (!p) return null;
  const id = pr.source_id;
  const zones = [
    ...(p.hand || []),
    ...(p.waiting_room || []),
    ...Object.values(p.stage || {}).filter(Boolean),
    ...(p.live_zone || []),
    ...(p.energy_zone || []),
  ];
  for (const c of zones) {
    if (c?.instance_id === id) return enrichCard(c);
  }
  return null;
}

function promptAbilityIndex(card, pr) {
  if (typeof pr?.ability_index === 'number') return pr.ability_index;
  const ab = pr?.ability;
  if (!ab || !card?.abilities?.length) return -1;
  return card.abilities.findIndex(a => a.type === ab.type && a.trigger === ab.trigger);
}

global.promptSourceDisplayName = function promptSourceDisplayName(pr, s) {
  const card = findPromptSourceCard(pr, s);
  if (card) return cardLocaleName(card);
  return pr?.source_name || t('prompt.respond');
}

global.localizePromptDisplayText = function localizePromptDisplayText(text, pr, s) {
  if (!text) return text;
  if (getLocale() !== 'ja') return localizeSubunitText(text);
  const card = findPromptSourceCard(pr, s);
  const idx = card ? promptAbilityIndex(card, pr) : -1;
  if (card && idx >= 0) {
    const fromAbility = abilityRulesTextFor(card, idx);
    const raw = String(text).trim();
    const enLine = (card.text || '').split(/\n/).map(l => l.trim()).find(l => l && raw.includes(l.slice(0, Math.min(24, l.length))));
    if (fromAbility && (!raw || raw === (pr?.effect_text || '').trim() || enLine)) return fromAbility;
  }
  if (card && text === (card.text || '').trim()) return cardRulesDisplayText(card);
  if (window.LLTCG_LOG_I18N?.localizePromptText) {
    return LLTCG_LOG_I18N.localizePromptText(text, G.allCards);
  }
  if (window.LLTCG_LOG_I18N?.localizeLogMessage) {
    return LLTCG_LOG_I18N.localizeLogMessage(text, G.allCards);
  }
  return text;
}

global.localizePromptEffectText = function localizePromptEffectText(pr, s) {
  const card = findPromptSourceCard(pr, s);
  const idx = card ? promptAbilityIndex(card, pr) : -1;
  if (card && idx >= 0) {
    const fromAbility = abilityRulesTextFor(card, idx);
    if (fromAbility) return fromAbility;
  }
  if (card && !pr?.effect_text) return cardRulesDisplayText(card);
  return localizePromptDisplayText(pr?.effect_text || '', pr, s);
}

global.isYesNoPromptChoices = function isYesNoPromptChoices(choices) {
  if (!choices || choices.length !== 2) return false;
  const a = String(choices[0]).toLowerCase();
  const b = String(choices[1]).toLowerCase();
  return (a === 'yes' && b === 'no') || (a === 'no' && b === 'yes');
}

global.promptChoiceLabel = function promptChoiceLabel(key, i, pr) {
  const k = String(key).toLowerCase();
  if (k === 'yes') return t('prompt.yes');
  if (k === 'no') return t('prompt.noSkip');
  if (k === 'skip') return t('prompt.skip');
  const raw = pr?.choice_labels?.[i];
  if (raw && getLocale() === 'ja') return localizePromptDisplayText(raw, pr, G.gameState);
  return raw || key;
}

global.promptQuestionText = function promptQuestionText(pr, effectDisplay, s) {
  const raw = (pr?.prompt || '').trim();
  const effect = (pr?.effect_text || '').trim();
  if (!raw || raw === effect || raw === effectDisplay) {
    return pr?.type === 'optional_live_start' ? t('prompt.useLiveStart') : t('prompt.useEffect');
  }
  return localizePromptDisplayText(raw, pr, s);
}

global.renderPromptEffectText = function renderPromptEffectText(text, pr, s){
  const box=el('prompt-effect');
  if(!box) return;
  const display = text
    ? (pr ? localizePromptDisplayText(text, pr, s) : (getLocale() === 'ja' && window.LLTCG_LOG_I18N?.localizePromptText
      ? LLTCG_LOG_I18N.localizePromptText(text, G.allCards) : text))
    : '';
  if(!display){
    box.hidden=true;
    box.innerHTML='';
    return;
  }
  box.hidden=false;
  renderCardRulesText(display, box);
}

global.isSelfActivationPrompt = function isSelfActivationPrompt(pr){
  if(isBranchChoicePrompt(pr)) return false;
  if(!pr?.effect_text) return false;
  if(pr.responder!==pr.owner) return false;
  const choices=Array.isArray(pr.choices)?pr.choices:[];
  if(choices.length&&!isYesNoPromptChoices(choices)) return false;
  return true;
}

global.ensurePromptChoices = function ensurePromptChoices(pr){
  if(!pr) return pr;
  const choices=Array.isArray(pr.choices)?pr.choices:[];
  const type=pr.type||'';
  const optionalType=isSelfActivationPrompt(pr)
    ||type==='optional_live_start'
    ||type==='optional_discard_prompt'
    ||type.startsWith('optional_');
  if(choices.length){
    if(isYesNoPromptChoices(choices)){
      return {...pr, choice_labels:[t('prompt.yes'), t('prompt.noSkip')]};
    }
    return pr;
  }
  if(!optionalType) return pr;
  return {
    ...pr,
    choices:['yes','no'],
    choice_labels:[t('prompt.yes'), t('prompt.noSkip')],
    prompt:pr.prompt||(type==='optional_live_start'
      ? t('prompt.useLiveStart')
      : t('prompt.useEffect')),
  };
}

global.isBranchChoicePrompt = function isBranchChoicePrompt(pr){
  if(!pr?.choices?.length) return false;
  const branchTypes=new Set([
    'player_choice','opponent_choice',
    'live_start_center_cost_choice','player_choice_wr_live_deck_bottom_draw',
    'player_choice_wr_members_deck_bottom','choice_energy_or_wr_lives_deck_top',
    'live_success_pick_energy_or_member','live_success_pay_choice_wr_add',
    'sbp5_aqours_blade_or_position','sbp6_live_wr_deck_position','sbp6_hand_deck_position',
    'ssd1_reveal_group_deck'
  ]);
  if(branchTypes.has(pr.type)){
    if(pr.type==='live_start_center_cost_choice'&&pr.step&&pr.step!=='pick_mode') return false;
    if(pr.type==='player_choice_wr_live_deck_bottom_draw'&&pr.step==='pick_wr_live') return false;
    return true;
  }
  const labels=(pr.choice_labels||[]).map(l=>String(l).trim().toLowerCase());
  if(labels.length<2) return false;
  const yesNoOnly=labels.every(l=>/^(yes|no)\b/.test(l)||l==='skip'||l==='both');
  return !yesNoOnly;
}

function surveilFindSlotIndex(id) {
  return G.surveil.slots.findIndex(x => x === id);
}

function surveilClearSelection() {
  G.surveil.selId = null;
}

function surveilTopIds() {
  return G.surveil.slots.filter(Boolean);
}

function mkSurveilCardEl(card, opts = {}) {
  const d = document.createElement('div');
  d.className = 'surveilcard ' + menuCardClasses(card);
  d.dataset.id = card.instance_id;
  if (G.surveil.selId === card.instance_id) d.classList.add('sel');
  if (G.surveil.drag?.id === card.instance_id) d.classList.add('dragging');
  appendCardFace(d, card);
  d.addEventListener('click', (ev) => {
    if (d._suppressMenuTap) {
      d._suppressMenuTap = false;
      return;
    }
    ev.stopPropagation();
    onSurveilCardTap(card.instance_id, opts);
  });
  bindSurveilCardDrag(d, card, card.instance_id);
  return d;
}

function bindSurveilCardDrag(node, card, id) {
  node.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    const drag = {
      id,
      startX: ev.clientX,
      startY: ev.clientY,
      moved: false,
      longFired: false,
      longPressTimer: setTimeout(() => {
        const d = G.surveil.drag;
        if (!d || d.id !== id || d.moved) return;
        d.longFired = true;
        const c = card || G.surveil?.byId?.[id];
        if (c) showPickMenuCard(c);
      }, LONG_PRESS_MS),
    };
    G.surveil.drag = drag;
    node.setPointerCapture?.(ev.pointerId);
  });
  node.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    const c = card || G.surveil?.byId?.[id];
    if (c) showPickMenuCard(c);
  });
  node.addEventListener('pointermove', (ev) => {
    const d = G.surveil.drag;
    if (!d || d.id !== id) return;
    if (!d.moved && (Math.abs(ev.clientX - d.startX) > 6 || Math.abs(ev.clientY - d.startY) > 6)) {
      d.moved = true;
      sfxCardPick();
      if (d.longPressTimer) {
        clearTimeout(d.longPressTimer);
        d.longPressTimer = null;
      }
      renderSurveilZones();
    }
  });
  node.addEventListener('pointerup', (ev) => {
    const d = G.surveil.drag;
    if (!d || d.id !== id) return;
    if (d.longPressTimer) {
      clearTimeout(d.longPressTimer);
      d.longPressTimer = null;
    }
    if (d.longFired) node._suppressMenuTap = true;
    G.surveil.drag = null;
    if (d.moved) {
      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      const slotEl = target?.closest?.('.surveil-slot');
      const wrEl = target?.closest?.('#surveil-wr');
      if (slotEl) {
        const idx = parseInt(slotEl.dataset.slot, 10);
        if (!Number.isNaN(idx)) surveilDropOnSlot(idx, id);
      } else if (wrEl) {
        surveilMoveToWr(id);
      }
      renderSurveilZones();
    }
    try { node.releasePointerCapture?.(ev.pointerId); } catch (_) {}
  });
  node.addEventListener('pointercancel', () => {
    const d = G.surveil.drag;
    if (d?.id === id && d.longPressTimer) clearTimeout(d.longPressTimer);
    if (G.surveil.drag?.id === id) G.surveil.drag = null;
    renderSurveilZones();
  });
}

function onSurveilCardTap(id, opts) {
  if (G.surveil.drag?.moved) return;
  const sel = G.surveil.selId;
  const inWr = G.surveil.wr.includes(id);
  const slotIdx = surveilFindSlotIndex(id);

  if (!sel) {
    G.surveil.selId = id;
    renderSurveilZones();
    return;
  }
  if (sel === id) {
    surveilClearSelection();
    renderSurveilZones();
    return;
  }

  const selWr = G.surveil.wr.includes(sel);
  const selSlot = surveilFindSlotIndex(sel);

  if (!selWr && slotIdx >= 0 && !inWr) {
    surveilSwapDeckPositions(sel, id);
  } else if (!selWr && inWr) {
    surveilMoveToWr(sel);
  } else if (selWr && slotIdx >= 0) {
    surveilPlaceInSlot(slotIdx, sel);
  } else if (selWr && inWr) {
    G.surveil.selId = id;
    renderSurveilZones();
    return;
  }
  surveilClearSelection();
  renderSurveilZones();
}

function surveilSwapDeckPositions(idA, idB) {
  const i = surveilFindSlotIndex(idA);
  const j = surveilFindSlotIndex(idB);
  if (i < 0 || j < 0) return;
  G.surveil.slots[i] = idB;
  G.surveil.slots[j] = idA;
}

function surveilPlaceInSlot(slotIdx, id) {
  if (slotIdx < 0 || slotIdx >= G.surveil.slots.length) return;
  const existing = G.surveil.slots[slotIdx];
  G.surveil.wr = G.surveil.wr.filter(x => x !== id);
  if (existing && existing !== id) {
    if (!G.surveil.wr.includes(existing)) G.surveil.wr.push(existing);
  }
  G.surveil.slots[slotIdx] = id;
}

function surveilDropOnSlot(slotIdx, id) {
  if (G.surveil.wr.includes(id)) {
    surveilPlaceInSlot(slotIdx, id);
    return;
  }
  const from = surveilFindSlotIndex(id);
  if (from < 0) return;
  const existing = G.surveil.slots[slotIdx];
  if (!existing) {
    G.surveil.slots[slotIdx] = id;
    G.surveil.slots[from] = null;
  } else if (existing !== id) {
    G.surveil.slots[from] = existing;
    G.surveil.slots[slotIdx] = id;
  }
}

function surveilMoveToWr(id) {
  const idx = surveilFindSlotIndex(id);
  if (idx >= 0) {
    G.surveil.slots[idx] = null;
    if (!G.surveil.wr.includes(id)) G.surveil.wr.push(id);
  } else if (G.surveil.wr.includes(id)) {
    // already in WR
  }
}

function surveilMoveToDeck(id) {
  if (!G.surveil.wr.includes(id)) return;
  G.surveil.wr = G.surveil.wr.filter(x => x !== id);
  const empty = G.surveil.slots.findIndex(x => !x);
  if (empty >= 0) G.surveil.slots[empty] = id;
  else G.surveil.slots.push(id);
}

global.renderSurveilOverlay = function renderSurveilOverlay(pr){
  const ovl=el('overlay-surveil');
  el('surveil-ttl').textContent=pr.source_name||'Look at deck';
  const n = (pr.looked_cards || []).length;
  el('surveil-msg').textContent=localizeSubunitText(pr.prompt||(
    n === 1
      ? 'Look at the top card of your deck. You may put it on top of your deck or put it into the Waiting Room.'
      : `Look at the top ${n} cards of your deck. You may put any number of them on top of your deck in any order and put the rest into the Waiting Room.`
  ));
  const cards = pr.looked_cards || [];
  G.surveil = {
    slots: cards.map(c => c.instance_id),
    wr: [],
    byId: {},
    selId: null,
    drag: null,
  };
  cards.forEach(c => { G.surveil.byId[c.instance_id] = c; });
  renderSurveilZones();
  ovl.classList.add('open');
  bumpAntiSoftlockButton();
}

global.renderSurveilZones = function renderSurveilZones(){
  const beforeByKey = captureShiftRectsByKey('.surveilcard', 'data-id');
  const slotsEl = el('surveil-deck-slots');
  const wrEl = el('surveil-wr');
  if (!slotsEl || !wrEl) return;
  slotsEl.innerHTML = '';
  wrEl.innerHTML = '';

  G.surveil.slots.forEach((id, idx) => {
    const slot = document.createElement('div');
    slot.className = 'surveil-slot' + (id ? ' has-card' : '');
    slot.dataset.slot = String(idx);
    const num = document.createElement('span');
    num.className = 'surveil-slot-num';
    num.textContent = String(idx + 1);
    const drop = document.createElement('div');
    drop.className = 'surveil-slot-drop';
    slot.appendChild(num);
    slot.appendChild(drop);
    if (id) {
      const card = G.surveil.byId[id];
      if (card) slot.appendChild(mkSurveilCardEl(card, { slot: idx }));
    }
    slot.addEventListener('click', (ev) => {
      if (ev.target.closest('.surveilcard')) return;
      const sel = G.surveil.selId;
      if (sel) {
        if (G.surveil.wr.includes(sel)) surveilPlaceInSlot(idx, sel);
        else surveilDropOnSlot(idx, sel);
        surveilClearSelection();
        renderSurveilZones();
      }
    });
    slotsEl.appendChild(slot);
  });

  G.surveil.wr.forEach(id => {
    const card = G.surveil.byId[id];
    if (card) wrEl.appendChild(mkSurveilCardEl(card, { wr: true }));
  });

  wrEl.onclick = (ev) => {
    if (ev.target.closest('.surveilcard')) return;
    const sel = G.surveil.selId;
    if (sel && !G.surveil.wr.includes(sel)) {
      surveilMoveToWr(sel);
      surveilClearSelection();
      renderSurveilZones();
    }
  };
  playSurveilShiftAnimation(beforeByKey);
}

global.confirmSurveil = async function confirmSurveil(){
  const all = Object.keys(G.surveil.byId);
  const assigned = new Set([...surveilTopIds(), ...G.surveil.wr]);
  if (all.some(id => !assigned.has(id))) { toast('Assign every card to a deck spot or Waiting Room'); return; }
  const btn = el('btn-surveil-ok');
  if (btn?.disabled) return;
  if (btn) btn.disabled = true;
  try {
    await sendAct('resolve_prompt',{choice:'confirm',top_ids:surveilTopIds(),wr_ids:[...G.surveil.wr]});
    clearDeferredPromptState();
    closeM('overlay-surveil');
    if (G.gameState && G.playerId) {
      updatePhaseActionButton(G.gameState, G.playerId);
      renderPrompt(G.gameState, G.playerId);
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

global.handlePromptChoice = function handlePromptChoice(pr, choice, s, myId){
  if (choice === 'no' && pr?.type === 'optional_swap_area_on_enter') choice = 'skip';
  const me=s.players[myId];
  const discardNeed=promptDiscardCount(pr,choice);
  const needsPay=(choice==='yes'&&!!pr.needs_pay)
    ||(pr.type==='optional_pay_energy_on_enter'&&choice==='yes')
    ||(pr.type==='live_start_pay_or_discard'&&choice==='pay')
    ||(pr.type==='sbp6_leave_play_wr_slot'&&choice==='yes'&&(pr.step||'')!=='pick');
  if(needsPay){
    const ae=(me.energy_zone||[]).filter(energyChipActive).length;
    const cost=pr.pay_cost||pr.ability?.cost||0;
    if(ae<cost){ toast(`Need ${energyCostHtml(cost)} active (have ${energyCostHtml(ae)})`, 2500, true); return; }
  }
  if(pr.type==='sbp6_hand_deck_position'&&(choice==='top'||choice==='bottom')){
    closeM('overlay-prompt');
    openHandPick({
      hand:me.hand||[], count:1, min:1,
      title:pr.source_name||'Deck position',
      msg:`Choose 1 card to put on deck ${choice}.`,
      onConfirm:(ids)=>sendAct('resolve_prompt',{discard_ids:ids, position:choice}),
      onCancel:()=>{ if(G.gameState) renderPrompt(G.gameState,myId); }
    });
    return;
  }
  if((pr.type==='sbp6_live_start_pay_member_score'||pr.type==='sbp6_swap_stage_wr_member')&&pr.step==='pay'&&choice==='discard'){
    closeM('overlay-prompt');
    const need=pr.type==='sbp6_swap_stage_wr_member'?1:2;
    openHandPick({
      hand:me.hand||[], count:need, min:need,
      title:pr.source_name||'Discard',
      msg:pr.prompt||`Discard ${need} card(s).`,
      onConfirm:(ids)=>sendAct('resolve_prompt',{choice:'discard', discard_ids:ids}),
      onCancel:()=>{ if(G.gameState) renderPrompt(G.gameState,myId); }
    });
    return;
  }
  if(pr.type==='optional_wr_member_reenter'&&choice==='yes'){
    closeM('overlay-prompt');
    openStageSlotPick({...pr, step:'pick_named', candidates:pr.candidates||[]});
    return;
  }
  if(pr.type==='optional_pos_change_subunit_blade'&&choice==='yes'){
    closeM('overlay-prompt');
    const slots=pr.target_slots||[];
    openStageSlotPick({
      ...pr,
      candidates: slots.map(slot=>({slot, name_en: slotLabel(slot)})),
      prompt: 'Choose a Mira-Cra Park! Member area to Position Change with.'
    });
    return;
  }
  if((pr.type==='optional_wr_live_deck_bottom'||pr.type==='live_success_yell_live_deck_bottom'
    ||pr.type==='live_success_pick_yell_deck_top')&&choice==='pick'){
    closeM('overlay-prompt');
    if (pr.type === 'live_success_pick_yell_deck_top') {
      openHandPick({
        hand: pr.candidates || [],
        count: 1,
        min: 1,
        title: pr.source_name || 'Deck top',
        msg: pr.prompt || 'Choose 1 card revealed for Yell to put on top of your deck.',
        onConfirm: (picked) => sendAct('resolve_prompt', { card_id: picked[0] }),
        onCancel: () => sendAct('resolve_prompt', { choice: 'skip' }),
      });
      return;
    }
    if (pr.type === 'live_success_yell_live_deck_bottom') {
      openYellRevealPick(pr, {
        onCancel: () => sendAct('resolve_prompt', { choice: 'skip' }),
      });
    } else {
      openWrLivePick(pr, {
        onCancel: () => sendAct('resolve_prompt', { choice: 'skip' }),
      });
    }
    return;
  }
  if((pr.type==='optional_wr_live_deck_bottom'||pr.type==='live_success_yell_live_deck_bottom'
    ||pr.type==='live_success_pick_yell_deck_top')&&(choice==='skip'||choice==='no')){
    closeM('overlay-prompt');
    sendAct('resolve_prompt', { choice: 'skip' });
    return;
  }
  if(discardNeed>0){
    closeM('overlay-prompt');
    const minPick=pr.ability?.max_discard?0:discardNeed;
    let pickHand=me.hand||[];
    if(pr.type==='optional_live_start'
      ||(pr.type==='optional_discard_prompt'&&(pr.live_start||s.phase==='live_start_effects'))){
      pickHand=optionalLiveStartDiscardHand(pr,s,myId);
    }
    if(pr.type==='opp_may_discard_or_modifier'){
      pickHand=pickHand.filter(c=>c.card_type==='ライブ');
      if(!pickHand.length){ toast('No Live card in hand'); return; }
    }
    if(pr.type==='live_start_pay_or_discard'&&choice==='discard'){
      pickHand=me.hand||[];
    }
    if(!pickHand.length && minPick===0){
      sendResolvePrompt(choice,{discard_ids:[],pay:needsPay});
      return;
    }
    openHandPick({
      hand:pickHand, count:discardNeed, min:minPick,
      title:pr.source_name||'Discard from hand',
      msg:pr.prompt||(minPick===0
        ? `Choose up to ${discardNeed} cards to send to the Waiting Room.`
        : discardNeed===1
        ? 'Choose a card to send to the Waiting Room.'
        : `Choose ${discardNeed} cards to send to the Waiting Room.`),
      onConfirm:(ids)=>sendResolvePrompt(choice,{discard_ids:ids,pay:needsPay}),
      onCancel:()=>{
        G._promptSubmitKey=null;
        closeM('overlay-hand-pick');
        if(G.gameState) renderPrompt(G.gameState,myId);
      }
    });
    return;
  }
  closeM('overlay-prompt');
  sendResolvePrompt(choice, needsPay?{pay:true}:{});
}

global.renderPromptSurveilBranch = function renderPromptSurveilBranch(s, myId, pr) {
  const ovl = el('overlay-prompt');
  ovl.classList.remove('open');
  renderSurveilOverlay(pr);
};

global.renderPromptDiscardHandBranch = function renderPromptDiscardHandBranch(s, myId, pr) {
  const ovl = el('overlay-prompt');
  if (G._deferredHandDrawIids?.size && isLiveSuccessDiscardPrompt(s)) {
    clearLiveSuccessHandDeferral(s);
    renderGame(s, { skipLog: true });
  }
  ovl.classList.remove('open');
  const me = s.players?.[myId];
  const need = pr.count || 1;
  const forceConfirm = s.phase === 'live_success_effects' || need > 1;
  openHandPick({
    hand: me?.hand || [],
    count: need,
    min: need,
    title: pr.source_name || t('prompt.discardFromHand'),
    msg: pr.prompt || ((need) === 1
      ? t('prompt.discardOne')
      : t('prompt.discardMany', { count: need })),
    allowCancel: false,
    forceConfirm,
    confirmLabel: forceConfirm && need > 1 ? t('prompt.selectThenConfirm') : undefined,
    onConfirm: (ids) => sendAct('resolve_prompt', { discard_ids: ids }),
  });
};

})(window);
