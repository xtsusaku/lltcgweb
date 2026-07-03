<?php
/**
 * WR members to hand + success-scored live score bonus — extracted from AbilityResolverSwitch.php.
 */

function tryResolveAbilityEffectSwitchWaitingRoomSuccess(
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
        case 'add_from_waiting_room':
            $candidates = array_values(array_filter($p['waiting_room'], function ($c) use ($ab) {
                if (($ab['filter'] ?? '') === 'member') {
                    return ($c['card_type'] ?? '') === 'メンバー';
                }
                return true;
            }));
            $take = min(intval($ab['count'] ?? 1), count($candidates));
            if ($take > 0) {
                $picked = array_slice($candidates, 0, $take);
                $pickedIds = array_column($picked, 'instance_id');
                $p['waiting_room'] = array_values(array_filter(
                    $p['waiting_room'],
                    fn($c) => !in_array($c['instance_id'] ?? '', $pickedIds, true)
                ));
                $p['hand'] = array_merge($p['hand'], $picked);
                $state = addLog($state, $state['players'][$pid]['name'] .
                    " — [$name] added $take Member(s) from Waiting Room to hand.");
            }
            break;

        case 'success_scored_live_score_bonus':
            if (!abilitySlotAllowed($ab, $ctx, $p, $source)) {
                break;
            }
            $slot = findMemberSlot($p, $source['instance_id'] ?? '');
            if (!empty($ab['center_only']) && $slot !== 'center') {
                break;
            }
            $targetScores = $ab['scores'] ?? null;
            if ($targetScores !== null) {
                $hasOne = false;
                $hasFive = false;
                foreach ($p['success_lives'] ?? [] as $c) {
                    $sc = intval($c['score'] ?? 0);
                    if ($sc === 1) $hasOne = true;
                    if ($sc === 5) $hasFive = true;
                }
                if ($hasOne && $hasFive) {
                    $amount = intval($ab['amount_two'] ?? 2);
                } elseif ($hasOne || $hasFive) {
                    $amount = intval($ab['amount_one'] ?? 1);
                } else {
                    break;
                }
            } else {
                $group = $ab['group'] ?? 'μ\'s';
                $scored = count(array_filter(
                    $p['success_lives'] ?? [],
                    fn($c) => ($c['group'] ?? '') === $group && intval($c['score'] ?? 0) > 0
                ));
                if ($scored >= 2) {
                    $amount = intval($ab['amount_two'] ?? 2);
                } elseif ($scored >= 1) {
                    $amount = intval($ab['amount_one'] ?? 1);
                } else {
                    break;
                }
            }
            $state = applyModifierEffect($state, $pid, [
                'type'   => 'live_score_bonus',
                'amount' => $amount,
            ]);
            $state = addLog($state, $state['players'][$pid]['name'] .
                " — [$name] Success Live score bonus +$amount until this Live ends.");
            break;

    }
    return $state;
}
