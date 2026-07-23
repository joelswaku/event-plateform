SELECT e.slug, e.status, e.visibility, ep.page_status
FROM events e
LEFT JOIN event_pages ep ON e.id = ep.event_id
WHERE e.deleted_at IS NULL
ORDER BY e.created_at DESC
LIMIT 10;
