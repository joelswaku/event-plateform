-- Update page_status for published events
UPDATE event_pages ep
SET page_status = 'PUBLISHED',
    published_at = COALESCE(published_at, NOW()),
    updated_at = NOW()
FROM events e
WHERE ep.event_id = e.id
  AND e.status = 'PUBLISHED'
  AND e.visibility = 'PUBLIC'
  AND e.deleted_at IS NULL
  AND (ep.page_status IS NULL OR ep.page_status != 'PUBLISHED');

-- Show results
SELECT e.slug, e.status, e.visibility, ep.page_status
FROM events e
LEFT JOIN event_pages ep ON e.id = ep.event_id
WHERE e.status = 'PUBLISHED'
  AND e.deleted_at IS NULL
LIMIT 10;
