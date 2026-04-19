export function getRuntimeEventStatus(event) {

    const now = new Date();
  
    // Cancelled always wins
    if (event.status === "CANCELLED") {
      return "CANCELLED";
    }
  
    // Draft events are not visible yet
    if (event.status === "DRAFT") {
      return "DRAFT";
    }
  
    // Published events follow timeline
    if (now < new Date(event.starts_at)) {
      return "UPCOMING";
    }
  
    if (
      now >= new Date(event.starts_at) &&
      now <= new Date(event.ends_at)
    ) {
      return "LIVE";
    }
  
    return "COMPLETED";
  }
  