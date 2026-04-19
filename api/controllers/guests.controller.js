// controllers/guests.controller.js
import * as guestsService from "../services/guests.service.js";

/* =========================
   ERROR HANDLER
========================= */
function handleError(res, error) {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server error",
    ...(error.details && { details: error.details }),
  });
}

/* =========================
   GUESTS
========================= */

export async function createGuest(req, res) {
  try {
    const guest = await guestsService.createGuestService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(201).json({ success: true, data: guest });
  } catch (e) {
    handleError(res, e);
  }
}

export async function listGuests(req, res) {
  try {
    const result = await guestsService.listGuestsService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, ...result });
  } catch (e) {
    handleError(res, e);
  }
}

export async function getGuestById(req, res) {
  try {
    const guest = await guestsService.getGuestByIdService({
      eventId: req.params.eventId,
      guestId: req.params.guestId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, data: guest });
  } catch (e) {
    handleError(res, e);
  }
}

export async function updateGuest(req, res) {
  try {
    const guest = await guestsService.updateGuestService({
      eventId: req.params.eventId,
      guestId: req.params.guestId,
      organizationId: req.organizationId,
      userId: req.user.id,
      payload: req.body,
    });

    res.json({ success: true, data: guest });
  } catch (e) {
    handleError(res, e);
  }
}

export async function deleteGuest(req, res) {
  try {
    await guestsService.deleteGuestService({
      eventId: req.params.eventId,
      guestId: req.params.guestId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, message: "Guest deleted" });
  } catch (e) {
    handleError(res, e);
  }
}

/* =========================
   GUEST GROUPS (PLACEHOLDER SAFE)
========================= */

export async function createGuestGroup(req, res) {
  return res.status(501).json({ message: "Not implemented yet" });
}

export async function listGuestGroups(req, res) {
  return res.status(501).json({ message: "Not implemented yet" });
}

export async function updateGuestGroup(req, res) {
  return res.status(501).json({ message: "Not implemented yet" });
}

export async function deleteGuestGroup(req, res) {
  return res.status(501).json({ message: "Not implemented yet" });
}

/* =========================
   RSVP
========================= */

export async function submitGuestRsvp(req, res) {
  try {
    const rsvp = await guestsService.submitGuestRsvpService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      payload: req.body,
    });

    res.json({ success: true, data: rsvp });
  } catch (e) {
    handleError(res, e);
  }
}

export async function listGuestRsvps(req, res) {
  try {
    const result = await guestsService.listGuestRsvpsService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, ...result });
  } catch (e) {
    handleError(res, e);
  }
}

/* =========================
   ATTENDANCE
========================= */

export async function markGuestAttendance(req, res) {
  try {
    const result = await guestsService.markGuestAttendanceService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
      payload: req.body,
    });

    res.json({ success: true, data: result });
  } catch (e) {
    handleError(res, e);
  }
}

/* =========================
   QR PASS
========================= */

export async function generateQrPass(req, res) {
  try {
    const result = await guestsService.generateQrCodeForGuestService({
      eventId: req.params.eventId,
      guestId: req.params.guestId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, data: result });
  } catch (e) {
    handleError(res, e);
  }
}

/* =========================
   INVITATIONS
========================= */

export async function sendGuestInvitation(req, res) {
  try {
    const result = await guestsService.sendInvitationEmailToGuestService({
      eventId: req.params.eventId,
      guestId: req.params.guestId,
      organizationId: req.organizationId,
      userId: req.user.id,
      payload: req.body,
    });

    res.json({ success: true, data: result });
  } catch (e) {
    handleError(res, e);
  }
}

/* =========================
   QR CHECK-IN
========================= */

export async function checkInGuestByQr(req, res) {
  try {
    const result = await guestsService.checkInGuestByQrTokenService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
      qrToken: req.body.qr_token,
      deviceId: req.body.device_id,
      appPlatform: req.body.app_platform,
      location: req.body.location,
    });

    res.json({
      success: true,
      message: "Checked in successfully",
      data: result,
    });
  } catch (e) {
    handleError(res, e);
  }
}

/* =========================
   DASHBOARD (FIXED ERROR)
========================= */

export async function getGuestDashboard(req, res) {
  try {
    const result = await guestsService.getGuestDashboardService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, data: result });
  } catch (e) {
    handleError(res, e);
  }
}
















// import * as guestsService from "../services/guests.service.js";

// /*
// |--------------------------------------------------------------------------
// | ERROR HANDLER
// |--------------------------------------------------------------------------
// */

// function handleError(res, error) {
//   console.error(error);
//   return res.status(error.statusCode || 500).json({
//     success: false,
//     message: error.message || "Server error",
//     ...(error.details && { details: error.details }),
//   });
// }


// function handleControllerError(res, error, fallbackMessage = "Internal server error") {
//   console.error(error);

//   const statusCode = error?.statusCode || 500;

//   return res.status(statusCode).json({
//     success: false,
//     message: error?.message || fallbackMessage,
//     ...(error?.details ? { details: error.details } : {}),
//   });
// }

// /*
// |--------------------------------------------------------------------------
// | GUESTS
// |--------------------------------------------------------------------------
// */

// // export async function createGuest(req, res) {
// //   try {
// //     const { eventId } = req.params;

// //     const guest = await guestsService.createGuestService({
// //       eventId,
// //       organizationId: req.organizationId,
// //       userId: req.user?.id,
// //       payload: req.body,
// //     });

// //     return res.status(201).json({
// //       success: true,
// //       message: "Guest created successfully",
// //       data: guest,
// //     });
// //   } catch (error) {
// //     return handleControllerError(res, error, "Failed to create guest");
// //   }
// // }
// export async function createGuest(req, res) {
//     try {
//       const guest = await guestsService.createGuestService({
//         eventId: req.params.eventId,
//         organizationId: req.organizationId,
//         userId: req.user.id,
//         payload: req.body,
//       });
  
//       res.status(201).json({ success: true, data: guest });
//     } catch (e) {
//       handleError(res, e);
//     }
//   }
  

// export async function listGuests(req, res) {
//   try {
//     const { eventId } = req.params;

//     const result = await guestsService.listGuestsService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//       query: req.query,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Guests fetched successfully",
//       ...result,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to fetch guests");
//   }
// }

// export async function getGuestById(req, res) {
//   try {
//     const { eventId, guestId } = req.params;

//     const guest = await guestsService.getGuestByIdService({
//       eventId,
//       guestId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Guest fetched successfully",
//       data: guest,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to fetch guest");
//   }
// }

// export async function updateGuest(req, res) {
//   try {
//     const { eventId, guestId } = req.params;

//     const guest = await guestsService.updateGuestService({
//       eventId,
//       guestId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//       payload: req.body,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Guest updated successfully",
//       data: guest,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to update guest");
//   }
// }

// export async function deleteGuest(req, res) {
//   try {
//     const { eventId, guestId } = req.params;

//     await guestsService.deleteGuestService({
//       eventId,
//       guestId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Guest deleted successfully",
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to delete guest");
//   }
// }

// /*
// |--------------------------------------------------------------------------
// | GUEST GROUPS
// |--------------------------------------------------------------------------
// */

// export async function createGuestGroup(req, res) {
//   try {
//     const { eventId } = req.params;

//     const group = await guestsService.createGuestGroupService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//       payload: req.body,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Guest group created successfully",
//       data: group,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to create guest group");
//   }
// }

// export async function listGuestGroups(req, res) {
//   try {
//     const { eventId } = req.params;

//     const groups = await guestsService.listGuestGroupsService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Guest groups fetched successfully",
//       data: groups,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to fetch guest groups");
//   }
// }

// export async function updateGuestGroup(req, res) {
//   try {
//     const { eventId, groupId } = req.params;

//     const group = await guestsService.updateGuestGroupService({
//       eventId,
//       groupId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//       payload: req.body,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Guest group updated successfully",
//       data: group,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to update guest group");
//   }
// }

// export async function deleteGuestGroup(req, res) {
//   try {
//     const { eventId, groupId } = req.params;

//     await guestsService.deleteGuestGroupService({
//       eventId,
//       groupId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Guest group deleted successfully",
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to delete guest group");
//   }
// }

// /*
// |--------------------------------------------------------------------------
// | RSVP
// |--------------------------------------------------------------------------
// */

// export async function submitGuestRsvp(req, res) {
//   try {
//     const { eventId } = req.params;

//     const rsvp = await guestsService.submitGuestRsvpService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id || null,
//       payload: req.body,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "RSVP submitted successfully",
//       data: rsvp,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to submit RSVP");
//   }
// }

// export async function listGuestRsvps(req, res) {
//   try {
//     const { eventId } = req.params;

//     const result = await guestsService.listGuestRsvpsService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//       query: req.query,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "RSVPs fetched successfully",
//       ...result,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to fetch RSVPs");
//   }
// }

// /*
// |--------------------------------------------------------------------------
// | ATTENDANCE
// |--------------------------------------------------------------------------
// */

// export async function markGuestAttendance(req, res) {
//   try {
//     const { eventId } = req.params;

//     const attendance = await guestsService.markGuestAttendanceService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//       payload: req.body,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Attendance marked successfully",
//       data: attendance,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to mark attendance");
//   }
// }

// /*
// |--------------------------------------------------------------------------
// | QR PASS
// |--------------------------------------------------------------------------
// */

// export async function generateQrPass(req, res) {
//   try {
//     const { eventId, guestId } = req.params;

//     const qr = await guestsService.generateQrCodeForGuestService({
//       eventId,
//       guestId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "QR pass generated successfully",
//       data: qr,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to generate QR pass");
//   }
// }



// export async function sendGuestInvitation(req, res) {
//     try {
//       const { eventId, guestId } = req.params;
  
//       const invitation = await guestsService.sendInvitationEmailToGuestService({
//         eventId,
//         guestId,
//         organizationId: req.organizationId,
//         userId: req.user?.id,
//         payload: req.body,
//       });
  
//       return res.status(201).json({
//         success: true,
//         message: "Invitation sent successfully",
//         data: invitation,
//       });
//     } catch (error) {
//       return handleControllerError(res, error, "Failed to send invitation");
//     }
//   }
// export async function checkInGuestByQr(req, res) {
//     try {
//       const { eventId } = req.params;
//       const { qr_token, device_id, app_platform, location } = req.body;
  
//       const result = await guestsService.checkInGuestByQrTokenService({
//         eventId,
//         organizationId: req.organizationId,
//         userId: req.user?.id,
//         qrToken: qr_token,
//         deviceId: device_id ?? null,
//         appPlatform: app_platform ?? null,
//         location: location ?? null,
//       });
  
//       return res.status(200).json({
//         success: true,
//         message: "Guest checked in successfully",
//         data: result,
//       });
//     } catch (error) {
//       return handleControllerError(res, error, "Failed to check in guest");
//     }
//   }
// // export async function checkInGuestByQr(req, res) {
// //     try {
// //       const result = await guestsService.checkInGuestByQrTokenService({
// //         eventId: req.params.eventId,
// //         organizationId: req.organizationId,
// //         userId: req.user.id,
// //         qrToken: req.body.qr_token,
// //         deviceId: req.body.device_id,
// //         appPlatform: req.body.app_platform,
// //         location: req.body.location,
// //       });
  
// //       res.status(200).json({
// //         success: true,
// //         message: "Checked in",
// //         data: result,
// //       });
// //     } catch (e) {
// //       handleError(res, e);
// //     }
// //   }


// //   export async function submitGuestRsvp(req, res) {
// //     try {
// //       const rsvp = await guestsService.submitGuestRsvpService({
// //         eventId: req.params.eventId,
// //         organizationId: req.organizationId,
// //         payload: req.body,
// //       });
  
// //       res.status(200).json({ success: true, data: rsvp });
// //     } catch (e) {
// //       handleError(res, e);
// //     }
// //   }

  
  













