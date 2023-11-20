CREATE TABLE accounting
(
    streamer_id INT NOT NULL REFERENCES streamers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    day DATE NOT NULL,
    time INTERVAL NOT NULL DEFAULT '0' CHECK(time >= '0'),
    diamonds INT NOT NULL DEFAULT 0 CHECK(diamonds >= 0),

    PRIMARY KEY(streamer_id, day)
);