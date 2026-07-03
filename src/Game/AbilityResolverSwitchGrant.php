<?php
/**
 * Grant hearts/blade/score to members — extracted from AbilityResolverSwitch.php.
 */

function tryResolveAbilityEffectSwitchGrant(
    array $state,
    string $pid,
    array $source,
    array $ab,
    array $ctx,
    string $type,
    array &$p,
    string $name
): array {
    switch ($type) {
        case 'grant_hearts':
            if (!empty($ab['hearts'])) {
                addBonusHeartsToModifier($state, $pid, $ab['hearts']);
                $state = addLog($state, $state['players'][$pid]['name'] .
                    " — [$name] gained bonus heart(s) until this Live ends.");
            }
            break;

        case 'grant_live_score_if_success':
            $succCount = count($p['success_lives'] ?? []);
            $scoreSum = sumSuccessLiveScores($p);
            if ($succCount >= intval($ab['min_success_count'] ?? 1)
                && $scoreSum <= intval($ab['max_success_score_sum'] ?? 1)) {
                $state = applyModifierEffect($state, $pid, [
                    'type'   => 'live_score_bonus',
                    'amount' => intval($ab['amount'] ?? 1),
                ]);
                $state = addLog($state, $state['players'][$pid]['name'] .
                    ' — [' . $name . '] Live total score +' . intval($ab['amount'] ?? 1) . ' until Live ends.');
            }
            break;
        case 'grant_hearts_if_slot_blade_hearts':
            $slot = $ab['slot'] ?? 'left';
            $mbr = $p['stage'][$slot] ?? null;
            if ($mbr && ($mbr['group'] ?? '') === ($ab['group'] ?? '')
                && memberBladeHeartCount($mbr) >= intval($ab['min_blade_hearts'] ?? 3)) {
                addBonusHeartsToMember($mbr, $ab['hearts'] ?? [], 1);
                $p['stage'][$slot] = $mbr;
                $state = addLog($state, $state['players'][$pid]['name'] .
                    ' — [' . $name . '] granted bonus hearts to ' .
                    ($mbr['name_en'] ?? $mbr['name']) . '.');
            }
            break;
        case 'grant_blade_if_slot_colored_hearts':
            $slot = $ab['slot'] ?? 'left';
            $mbr = $p['stage'][$slot] ?? null;
            $color = $ab['heart_color'] ?? 'red';
            if ($mbr && ($mbr['group'] ?? '') === ($ab['group'] ?? '')
                && memberHeartColorCount($mbr, $color) >= intval($ab['min_hearts'] ?? 3)) {
                $amt = intval($ab['blade'] ?? 2);
                $mbr['live_blade_bonus'] = intval($mbr['live_blade_bonus'] ?? 0) + $amt;
                $p['stage'][$slot] = $mbr;
                $state = addLog($state, $state['players'][$pid]['name'] .
                    ' — [' . $name . '] granted +' . $amt . ' Blade to ' .
                    ($mbr['name_en'] ?? $mbr['name']) . '.');
            }
            break;
        case 'grant_named_members_blade':
            $n = applyNamedMemberBladeBonus($state, $pid, $ab['grants'] ?? []);
            if ($n > 0) {
                $state = addLog($state, $state['players'][$pid]['name'] .
                    " — [$name] $n named Member(s) gained Blade until Live ends.");
            }
            break;
    }
    return $state;
}
