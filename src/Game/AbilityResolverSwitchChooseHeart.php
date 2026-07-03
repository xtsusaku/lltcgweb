<?php
/**
 * Heart-color choice prompts — extracted from AbilityResolverSwitch.php.
 */

function tryResolveAbilityEffectSwitchChooseHeart(
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
        case 'choose_heart_per_success':
            if (!empty($state['pending_prompt'])) break;
            $choices = $ab['heart_choices'] ?? ['yellow', 'pink', 'purple'];
            $labels = array_map(fn($c) => ucfirst($c) . ' ♡', $choices);
            $state['pending_prompt'] = [
                'type'          => 'choose_heart_per_success',
                'owner'         => $pid,
                'responder'     => $pid,
                'source_name'   => $name,
                'prompt'        => 'Choose a heart color to gain for each Success Live card until this Live ends.',
                'choices'       => $choices,
                'choice_labels' => $labels,
                'ability'       => $ab,
            ];
            $state = addLog($state, $state['players'][$pid]['name'] .
                ' — [' . $name . '] Live Start: choose a heart color.');
            break;
        case 'choose_heart_one_mus_member':
            if (!empty($ab['requires_success_lives']) && empty($p['success_lives'])) break;
            if (!empty($state['pending_prompt'])) break;
            $choices = $ab['heart_choices'] ?? ['yellow', 'pink', 'purple'];
            $state['pending_prompt'] = [
                'type'          => 'choose_heart_mus_member',
                'owner'         => $pid,
                'responder'     => $pid,
                'source_name'   => $name,
                'prompt'        => 'Choose a heart for 1 μ\'s Member on your Stage to gain until this Live ends.',
                'choices'       => $choices,
                'choice_labels' => array_map(fn($c) => ucfirst($c) . ' ♡', $choices),
                'ability'       => $ab,
            ];
            $state = addLog($state, $state['players'][$pid]['name'] .
                ' — [' . $name . '] Live Start: choose a heart for a μ\'s Member.');
            break;
        case 'choose_heart_other_member':
            if (!empty($state['pending_prompt'])) break;
            $choices = $ab['heart_choices'] ?? ['yellow', 'pink', 'purple', 'green', 'blue', 'red'];
            $state['pending_prompt'] = [
                'type'          => 'choose_heart_other_member',
                'owner'         => $pid,
                'responder'     => $pid,
                'source_id'     => $source['instance_id'] ?? '',
                'source_name'   => $name,
                'prompt'        => 'Choose a heart color for another Member on your Stage.',
                'choices'       => $choices,
                'choice_labels' => array_map(fn($c) => ucfirst($c) . ' ♡', $choices),
                'ability'       => $ab,
            ];
            break;
        case 'choose_heart_modifier':
            if (!empty($state['pending_prompt'])) break;
            $choices = $ab['heart_choices'] ?? ['yellow', 'pink', 'purple'];
            $state['pending_prompt'] = [
                'type'          => 'choose_heart_modifier',
                'owner'         => $pid,
                'responder'     => $pid,
                'source_name'   => $name,
                'prompt'        => 'Choose a heart color to gain until this Live ends.',
                'choices'       => $choices,
                'choice_labels' => array_map(fn($c) => ucfirst($c) . ' ♡', $choices),
                'ability'       => $ab,
            ];
            $state = addLog($state, $state['players'][$pid]['name'] .
                ' — [' . $name . '] choose a heart color.');
            break;
        case 'choose_required_heart_pair_gray':
            if (!stageHasGroupMember($p, $ab['requires_stage_group'] ?? '')) break;
            if (!empty($state['pending_prompt'])) break;
            $choices = $ab['colors'] ?? ['pink', 'green', 'blue'];
            $state['pending_prompt'] = [
                'type'          => 'choose_required_heart_pair_gray',
                'owner'         => $pid,
                'responder'     => $pid,
                'source_id'     => $source['instance_id'] ?? '',
                'source_name'   => $name,
                'prompt'        => 'Choose pink, green, or blue — required hearts become 2 of that color and 1 Gray Heart.',
                'choices'       => $choices,
                'choice_labels' => array_map(
                    fn($c) => ucfirst($c) . ' ♡, ' . ucfirst($c) . ' ♡, Gray ♡',
                    $choices
                ),
                'ability'       => $ab,
            ];
            $state = addLog($state, $state['players'][$pid]['name'] .
                ' — [' . $name . '] choose required heart pattern.');
            break;
    }
    return $state;
}
