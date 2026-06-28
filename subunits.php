<?php
/**
 * Official English subunit names (from tcg/cards.json energy cards + app catalog).
 * Internal game logic keeps JP keys on cards; use subunitDisplayEn() for player-facing copy.
 */

const SUBUNIT_EN = [
    'スリーズブーケ' => 'Cerise Bouquet',
    'Cerise Bouquet' => 'Cerise Bouquet',
    'みらくらぱーく！' => 'Mira-Cra Park!',
    'みらくらぱーく!' => 'Mira-Cra Park!',
    'Mirakuru Park!' => 'Mira-Cra Park!',
    'Mira-Cra Park!' => 'Mira-Cra Park!',
    'DOLLCHESTRA' => 'DOLLCHESTRA',
    'Edel Note' => 'Edel Note',
    'E del Note' => 'Edel Note',
    '5yncri5e!' => '5yncri5e!',
    'KALEIDOSCORE' => 'KALEIDOSCORE',
    'プリパラ' => 'Printemps',
    'Printemps' => 'Printemps',
    'リリホワ' => 'lily white',
    'lily white' => 'lily white',
    'バイバイ' => 'BiBi',
    'BiBi' => 'BiBi',
    'CYaRon！' => 'CYaRon!',
    'CYaRon!' => 'CYaRon!',
    'シャロン' => 'CYaRon!',
    'アゼリア' => 'AZALEA',
    'AZALEA' => 'AZALEA',
    'ギルキス' => 'Guilty Kiss',
    'Guilty Kiss' => 'Guilty Kiss',
    'セイントスノー' => 'Saint Snow',
    'Saint Snow' => 'Saint Snow',
    'Sunny Passion' => 'Sunny Passion',
    'Aqours/Saint Snow' => 'Aqours/Saint Snow',
    'A・ZU・NA' => 'A・ZU・NA',
    'QU4RTZ' => 'QU4RTZ',
    'R3BIRTH' => 'R3BIRTH',
    'ダイバーディーバ' => 'DiverDiva',
    'DiverDiva' => 'DiverDiva',
    'キャチュー' => 'CatChu!',
    'CatChu!' => 'CatChu!',
    'A-RISE' => 'A-RISE',
];

function subunitDisplayEn(string $subunit): string
{
    if ($subunit === '') {
        return $subunit;
    }
    if (isset(SUBUNIT_EN[$subunit])) {
        return SUBUNIT_EN[$subunit];
    }
    return str_replace('！', '!', $subunit);
}

function localizeSubunitText(?string $text): string
{
    if ($text === null || $text === '') {
        return (string)$text;
    }
    $out = str_replace('Mirakuru Park!', 'Mira-Cra Park!', $text);
    $keys = array_keys(SUBUNIT_EN);
    usort($keys, static fn(string $a, string $b): int => strlen($b) <=> strlen($a));
    foreach ($keys as $jp) {
        $en = SUBUNIT_EN[$jp];
        if ($jp !== $en && str_contains($out, $jp)) {
            $out = str_replace($jp, $en, $out);
        }
    }
    return $out;
}
