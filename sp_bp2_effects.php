<?php
/**
 * Liella! (Superstar) bp2 effect type registry.
 * Handlers live in effects.php (shared with other sets); this file satisfies audit_prefix.
 * Included by effects.php.
 */

function spBp2EffectTypes(): array {
    return [
        'activated_discard_trigger_on_enter',
        'activated_swap_area_member',
        'auto_area_move_energy_wait',
        'auto_yell_no_blade_heart',
        'blade_per_hand_cards',
        'draw_and_discard',
        'hearts_if_center_highest_cost',
        'if_baton_wr_group_to_hand',
        'live_success_pick_yell_card',
        'optional_discard_prompt',
        'optional_negate_member_live_start_add_wr',
        'optional_pay_energy',
        'optional_wr_to_deck_top',
        'pick_wr_distinct_lives_opp_choice',
        'reduce_yell_reveal_count',
        'aura_opp_live_required_gray',
        'score_if_fewer_success_lives',
        'score_if_hand_more_than_opp',
    ];
}

function spBp2IsEffectType(string $type): bool {
    return in_array($type, spBp2EffectTypes(), true);
}
