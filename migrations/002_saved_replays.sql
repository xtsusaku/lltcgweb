-- Saved match replay library for signed-in accounts.

CREATE TABLE IF NOT EXISTS tcg_replays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    saver_player_id TEXT NOT NULL,
    saver_name TEXT,
    opponent_name TEXT,
    winner TEXT,
    end_reason TEXT,
    turn INTEGER NOT NULL DEFAULT 0,
    phase TEXT,
    action_count INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL,
    saved_at INTEGER NOT NULL,
    FOREIGN KEY (discord_id) REFERENCES tcg_users(discord_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tcg_replays_user_saved
    ON tcg_replays(discord_id, saved_at DESC);
