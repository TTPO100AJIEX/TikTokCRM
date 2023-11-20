CREATE VIEW streamers_view AS
    SELECT streamers.*, SUM(accounting.time) AS total_time, SUM(accounting.diamonds) AS total_diamonds
    FROM streamers INNER JOIN accounting ON streamers.id = accounting.streamer_id
    GROUP BY (streamers.id);