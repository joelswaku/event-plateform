

export async function resolveOrganization(req, res, next) {

    const headerOrg = req.headers["x-organization-id"];
    const queryOrg = req.query.organizationId;

    
   
    if (headerOrg) {
      req.organizationId = headerOrg;
      return next();
    }
   
    if (queryOrg) {
      req.organizationId = queryOrg;
      return next();
    }
   
    if (req.user?.organizationId) {
      req.organizationId = req.user.organizationId;
      return next();
    }
   
    return res.status(400).json({
      success: false,
      message: "Organization not specified"
    });
   }