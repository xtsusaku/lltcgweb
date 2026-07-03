<?php

declare(strict_types=1);

namespace LLTCG\Game;

final class EffectRegistry
{
    /** @return list<string> */
    public static function knownAbilityTypes(): array
    {
        static $types = null;
        if ($types !== null) {
            return $types;
        }
        $root = dirname(__DIR__, 2);
        $paths = glob($root . '/src/Game/AbilityResolverSwitch*.php') ?: [];
        $all = [];
        foreach ($paths as $path) {
            $src = (string)file_get_contents($path);
            if (preg_match_all("/case '([a-z0-9_]+)':/", $src, $m)) {
                foreach ($m[1] as $type) {
                    $all[$type] = true;
                }
            }
        }
        $types = array_keys($all);
        sort($types);
        return $types;
    }

    public static function isKnownType(string $type): bool
    {
        return in_array($type, self::knownAbilityTypes(), true);
    }
}
